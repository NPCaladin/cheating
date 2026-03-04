import fs from "fs";
import path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

interface BaitPhrase {
  text: string;
  riskScore: number;
  variants: string[];
}

interface BaitCategory {
  id: string;
  name: string;
  weight: number;
  phrases: BaitPhrase[];
}

interface CombinationRule {
  id: string;
  description: string;
  conditions: string[];
  bonusRiskScore: number;
}

interface BaitPhrasesData {
  categories: BaitCategory[];
  combinationRules: CombinationRule[];
}

interface WarningSignal {
  id: string;
  name: string;
  riskScore: number;
  examples: string[];
}

interface WarningSignalsData {
  signals: WarningSignal[];
}

export interface MatchedPhrase {
  text: string;
  riskScore: number;
  categoryWeight: number;
  categoryName: string;
}

export interface MatchedSignal {
  id: string;
  name: string;
  riskScore: number;
  matchedExample: string;
}

export interface PreScreenResult {
  riskScore: number;
  matchedPhrases: MatchedPhrase[];
  matchedSignals: MatchedSignal[];
  combinationBonuses: { id: string; description: string; bonus: number }[];
  shouldCallGPT: boolean;
  promptContext: string;
}

// ── Module-level cached data ──────────────────────────────────────────────────

const dataDir = path.join(process.cwd(), "data");

const baitPhrasesData: BaitPhrasesData = JSON.parse(
  fs.readFileSync(path.join(dataDir, "bait-phrases.json"), "utf-8")
);

const warningSignalsData: WarningSignalsData = JSON.parse(
  fs.readFileSync(path.join(dataDir, "warning-signals.json"), "utf-8")
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize obfuscated text that uses interpunct dots or spaces between
 * characters to evade keyword filters.
 * e.g. "카·카·오·톡" → "카카오톡", "제·휴·사" → "제휴사"
 * Also normalizes full-width characters and excess whitespace.
 */
export function normalizeText(text: string): string {
  return text
    // Remove interpunct dots between Korean/alphanumeric characters
    .replace(/([가-힣a-zA-Z0-9])\s*[·•ː]\s*(?=[가-힣a-zA-Z0-9])/g, "$1")
    // Normalize full-width ASCII characters (Ａ→A, ０→0, etc.)
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // Collapse multiple whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// ── Core matchers ─────────────────────────────────────────────────────────────

export function matchBaitPhrases(text: string): MatchedPhrase[] {
  const matched: MatchedPhrase[] = [];

  for (const category of baitPhrasesData.categories) {
    for (const phrase of category.phrases) {
      const variants = [phrase.text, ...phrase.variants];
      const hit = variants.some((v) => new RegExp(escapeRegex(v), "i").test(text));
      if (hit) {
        matched.push({
          text: phrase.text,
          riskScore: phrase.riskScore,
          categoryWeight: category.weight,
          categoryName: category.name,
        });
      }
    }
  }

  return matched;
}

export function matchWarningSignals(text: string): MatchedSignal[] {
  const matched: MatchedSignal[] = [];

  for (const signal of warningSignalsData.signals) {
    for (const example of signal.examples) {
      if (new RegExp(escapeRegex(example), "i").test(text)) {
        matched.push({
          id: signal.id,
          name: signal.name,
          riskScore: signal.riskScore,
          matchedExample: example,
        });
        break; // one match per signal is enough
      }
    }
  }

  return matched;
}

export function evaluateCombinations(
  matchedPhrases: MatchedPhrase[],
  text: string
): { id: string; description: string; bonus: number }[] {
  const bonuses: { id: string; description: string; bonus: number }[] = [];

  for (const rule of baitPhrasesData.combinationRules) {
    const allMet = rule.conditions.every(
      (cond) =>
        new RegExp(escapeRegex(cond), "i").test(text) ||
        matchedPhrases.some((p) => p.text.includes(cond))
    );
    if (allMet) {
      bonuses.push({ id: rule.id, description: rule.description, bonus: rule.bonusRiskScore });
    }
  }

  return bonuses;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function preScreenText(text: string): PreScreenResult {
  // Normalize first so obfuscated text (카·카·오) is matched correctly
  const normalizedText = normalizeText(text);

  const matchedPhrases = matchBaitPhrases(normalizedText);

  // Run signals on normalized text (catches regular patterns) AND original text
  // (catches text-obfuscation signal which uses the raw dots as evidence)
  const signalsFromNormalized = matchWarningSignals(normalizedText);
  const signalsFromOriginal = matchWarningSignals(text);

  // Merge, deduplicating by signal id
  const seenSignalIds = new Set(signalsFromNormalized.map((s) => s.id));
  const extraSignals = signalsFromOriginal.filter((s) => !seenSignalIds.has(s.id));
  const matchedSignals = [...signalsFromNormalized, ...extraSignals];

  const combinationBonuses = evaluateCombinations(matchedPhrases, normalizedText);

  // Weighted score: phrases 70%, signals 30%
  let riskScore = 0;

  if (matchedPhrases.length > 0) {
    const weightedSum = matchedPhrases.reduce((s, p) => s + p.riskScore * p.categoryWeight, 0);
    riskScore += (weightedSum / matchedPhrases.length) * 0.7;
  }

  if (matchedSignals.length > 0) {
    const signalAvg = matchedSignals.reduce((s, sig) => s + sig.riskScore, 0) / matchedSignals.length;
    riskScore += signalAvg * 0.3;
  }

  riskScore += combinationBonuses.reduce((s, b) => s + b.bonus, 0);
  riskScore = Math.min(100, Math.round(riskScore));

  const shouldCallGPT = riskScore > 15;

  // Build context string injected into GPT prompt
  const lines = ["[1차 로컬 분석 결과]"];

  if (matchedPhrases.length > 0) {
    lines.push(
      `감지된 미끼 문구: ${matchedPhrases.map((p) => `${p.text}(${p.riskScore})`).join(", ")}`
    );
  } else {
    lines.push("감지된 미끼 문구: 없음");
  }

  if (matchedSignals.length > 0) {
    lines.push(`감지된 위험 신호: ${matchedSignals.map((s) => s.name).join(", ")}`);
  } else {
    lines.push("감지된 위험 신호: 없음");
  }

  lines.push(`1차 위험 점수: ${riskScore}/100`);
  lines.push("위 결과를 참고하되, 전체 맥락을 고려하여 최종 판정하세요.");

  return {
    riskScore,
    matchedPhrases,
    matchedSignals,
    combinationBonuses,
    shouldCallGPT,
    promptContext: lines.join("\n"),
  };
}
