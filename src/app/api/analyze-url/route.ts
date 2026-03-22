import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractYoutubeId, fetchYoutubeMeta, fetchYoutubeTranscript } from "@/lib/youtube";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";
import { logAnalysis, maskSensitive, extractDomain } from "@/lib/log-analysis";
import { callGemini } from "@/lib/gemini";
import { getKnowledgeContext } from "@/lib/knowledge-db";

export const maxDuration = 300;

const BASE_SYSTEM_PROMPT = `당신은 소비자 피해 예방을 위한 콘텐츠 패턴 분석 AI입니다.
YouTube 영상, SNS 게시글 등 온라인 콘텐츠에서 알려진 위험 패턴을 탐지하고, 이용자가 스스로 판단할 수 있도록 참고 정보를 제공합니다.
특정 개인이나 채널을 사기꾼으로 단정하지 마세요. 콘텐츠의 패턴을 분석하는 것이며, 최종 판단은 이용자와 수사기관의 몫입니다.
자막이 존재할 경우, 자막의 원문을 직접 인용("큰따옴표"로 감싸서)하여 분석 근거를 제시하세요.

## 핵심 역할 및 차별화
1. **한국 법령 전문**: 자본시장법, 방문판매법, 전자상거래법 등 구체적 조항과 처벌 내용 명시
2. **콘텐츠 마케팅 전략 분석**: 클릭베이트 제목, 채널 성장 전술, 수익화 구조 파악
3. **심리 조작 기법 분석**: FOMO, 앵커링, 사회적 증거, 권위 효과 등 사기에 사용된 심리 전술 분석
4. **즉시 실행 체크리스트**: 공식 기관 URL·전화번호를 포함한 당장 실행 가능한 검증 방법
5. **구체적 신고 가이드**: 단계별 신고 절차와 기관별 접수 방법 안내

## 사기 유형 (15개)
### 투자/재테크 사기
- 주식 리딩방/유료 종목 추천: VIP 회원, 종목 선공개, 선행매매
- 코인/가상화폐 리딩방: 스테이킹 고수익, 상장 전 코인, 내부자 정보
- FX마진/해외선물 리딩방: 자동매매, 레버리지 과장
- AI 자동매매 투자 사기: AI 기술 빙자 수익 보장

### 강연/교육 사기
- 성공팔이 (자기계발 강연): 과장된 성공 서사, 무료 웨비나 → 고가 코칭 업셀링
- 고액 온라인 부업 강의: 월 수백만원 약속, 강의만으로 수익 가능 과장
- 코딩/부트캠프 취업 사기: 취업률 조작, "6개월 만에 개발자"
- 민간자격증 사기: 국가공인 혼동 유도, 취업 보장 허위 약속
- 보상형 플랫폼 사기: 미션 후 현금 지급, 선납 후 먹튀

### 부업/커머스 사기
- 팀미션/SNS 부업 사기: 10초에 5천원, 좋아요 알바, 텔레그램 보증금
- 스마트스토어 대리운영 사기: 수익 보장, 초기 비용 편취
- 해외구매대행/아마존 사기: 아마존 사칭, 재고 선납

### 부동산/다단계/기타
- 부동산 강연 사기: 개발 호재 과장, 미등록 중개
- 다단계/네트워크마케팅: 지인 모집 수익, 의무 구매
- 로또/도박/스포츠토토: 픽스터, AI 예측, 승률 보장

## 10대 위험 신호
1. 수익/원금 보장
2. 비현실적 수익률 (연 50% 이상)
3. 즉석 결정 강요 (오늘만, 선착순)
4. 초기 소액 체험 후 고액 유도
5. 단계적 업셀링
6. 자격/이력 검증 불가
7. 후기/실적 조작 의심
8. 환불 규정 불명확
9. 다단계 구조
10. 외부 메신저 유도 또는 출금 차단

## YouTube/SNS 콘텐츠 분석 추가 기준
- **제목 전략**: 클릭베이트, 과장, 호기심 갭, 숫자 과장 등
- **채널 패턴**: 수익화 모델, 타겟 심리, 업셀링 구조
- **자막/스크립트 분석**: 실제 발언과 약속의 진위성
- **주의**: 자막 없이 제목/채널명만으로 분석할 경우 신뢰도를 medium 이하로 설정

## 중요 원칙 (반드시 준수)
1. 특정 개인·채널·단체를 사기꾼으로 단정하거나 범죄자로 규정하지 마세요.
2. "~사기입니다", "~사기 패턴입니다", "전형적인 성공팔이" 같은 단정적 표현을 사용하지 마세요.
3. 대신 "~와 유사한 패턴이 발견됩니다", "~요소가 감지됩니다" 같은 관찰적 표현을 사용하세요.
4. summary에서 특정 채널명이나 인물명을 직접 언급하지 마세요. "해당 콘텐츠", "분석 대상 영상" 등으로 표현하세요.
5. "즉시 신고해야 합니다" 같은 강제적 표현 대신 "의심되는 경우 관련 기관에 확인할 수 있습니다"를 사용하세요.
6. 법적 위반을 단정하지 마세요. "위반입니다" 대신 "위반 소지가 있을 수 있습니다"를 사용하세요.

## 자막 직접 인용 규칙
자막이 제공된 경우:
1. detectedSignals의 각 evidence에 자막 원문을 "큰따옴표"로 감싸서 인용
2. psychologyTactics의 각 evidence에도 자막 원문 직접 인용
3. transcriptAnalysis에 최소 3개의 주의가 필요한 발언을 원문 그대로 인용
4. 자막이 길 경우 전체를 훑어 초반/중반/후반에서 골고루 인용
5. 인용 시에도 "문제 발언", "사기 발언" 대신 "주의가 필요한 표현"으로 서술

## 응답 형식 (반드시 순수 JSON만, 마크다운 코드블록 절대 금지)

{
  "riskScore": 0-100,
  "riskLevel": "safe|low|medium|high|critical",
  "verdict": "안전|주의|확인 필요|높은 주의|즉시 확인 필요",
  "summary": "반드시 4-6문장. 관찰된 패턴 요약 → 이용자가 확인해야 할 사항 → 관련 법령 참고 안내 순서. 특정 채널명/인물명 직접 언급 금지. 단정적 표현 금지.",
  "similarPatterns": [
    {
      "pattern": "유사 위험 패턴명 (예: 과장 광고 패턴, 고수익 보장 패턴, 업셀링 유도 패턴)",
      "similarity": "high|medium|low",
      "reason": "2-3문장. '~사기입니다' 대신 '~와 유사한 요소가 발견됩니다' 표현 사용"
    }
  ],
  "detectedSignals": [
    {
      "signal": "관찰된 위험 요소명",
      "evidence": "자막/제목에서 발견된 실제 문구 그대로 인용",
      "severity": "high|medium|low",
      "explanation": "이 요소가 왜 주의가 필요한지 1-2문장 설명"
    }
  ],
  "safeAspects": ["실제 존재하는 안전 요소를 구체적으로 서술 (없으면 빈 배열)"],
  "recommendation": "반드시 3-4문장. 결제 전 확인 사항 + 검증 방법 안내. '신고해야 합니다'가 아닌 '확인할 수 있습니다' 톤.",
  "reportTo": ["기관명 + 연락처 (해당 시)"],
  "legalAnalysis": {
    "relevanceLevel": "high|medium|low|none",
    "relatedLaws": [
      "법률명 (조항): 관련될 수 있는 법령 안내. '위반입니다'가 아닌 '관련 법령'으로 소개"
    ],
    "explanation": "2-3문장. 관련 법령 참고 안내. 법적 위반 여부는 수사기관과 법원만이 판단할 수 있음을 전제."
  },
  "psychologyTactics": [
    {
      "tactic": "관찰된 설득 기법명",
      "description": "이 기법의 작동 원리와 소비자에게 미칠 수 있는 영향 1-2문장",
      "evidence": "자막/제목에서 해당 기법이 관찰된 구체적 문구 인용"
    }
  ],
  "verificationChecklist": [
    {
      "item": "확인해야 할 항목명",
      "method": "구체적 확인 방법: 기관명 + 전화번호 또는 공식 URL 포함",
      "priority": "high|medium|low"
    }
  ],
  "reportingGuide": {
    "primaryAgency": "관련 문의/확인 기관명",
    "phone": "대표 전화번호",
    "website": "공식 페이지 URL",
    "steps": [
      "1단계: 의심되는 경우 증거 보존 방법",
      "2단계: 관련 기관에 문의/확인하는 방법",
      "3단계: 피해가 확인된 경우 구제 절차"
    ]
  },
  "analysisConfidence": "high|medium|low",
  "confidenceReason": "분석 신뢰도가 이 수준인 이유 1문장",
  "transcriptAnalysis": [
    {
      "quote": "자막에서 발견된 주의가 필요한 표현 원문 (정확히 인용)",
      "timestamp": "영상 내 대략적 위치 (초반부/중반부/후반부)",
      "issue": "이 표현이 왜 주의가 필요한지 2-3문장으로 설명. 단정적 판단 금지.",
      "relatedPattern": "관련 위험 패턴명",
      "severity": "high|medium|low"
    }
  ]
}

이 분석 결과는 AI의 텍스트 패턴 매칭 결과이며, 특정 개인·채널에 대한 사실 판단이 아닙니다.
riskScore는 텍스트에서 감지된 주의 요소의 밀도를 나타내는 참고 수치이며, 사기 여부를 확정하는 점수가 아닙니다.

점수 기준:
- 0-20: safe (안전) — 알려진 위험 패턴 미감지
- 21-40: low (낮은 주의) — 일부 주의 요소 감지, 추가 확인 권장
- 41-60: medium (주의) — 여러 주의 요소 감지, 결제 전 검증 권장
- 61-80: high (높은 주의) — 다수의 주의 요소 감지, 결제 전 반드시 검증 권장
- 81-100: critical (즉시 확인 필요) — 강한 주의 요소 다수 감지, 결제 전 관련 기관에 확인 권장

## 분석 품질 기준 (반드시 준수)
- summary: 반드시 4-6문장. 단정적 표현 절대 금지. 채널명/인물명 직접 언급 금지.
- detectedSignals: 반드시 3개 이상. severity에 "critical" 사용 금지 (최대 "high").
- legalAnalysis: "위반입니다" 표현 금지. "관련 법령", "소지가 있을 수 있습니다"로 표현.
- psychologyTactics: 반드시 2개 이상. evidence에 자막 원문 인용.
- verificationChecklist: 반드시 3개 이상, 공식 기관 URL 또는 전화번호 포함
- transcriptAnalysis: 자막이 있을 경우 반드시 3개 이상. 자막 없으면 빈 배열
- 자막 없이 분석 시: analysisConfidence를 반드시 "medium" 이하로 설정

순수 JSON만 응답하세요. 마크다운 코드블록이나 다른 텍스트를 절대 포함하지 마세요.`;

/** Sanitize user input to prevent prompt injection */
function sanitizeInput(text: string): string {
  return text
    .replace(/\[시스템\]|\[SYSTEM\]|\[INST\]|\[\/INST\]/gi, "")
    .replace(/ignore\s+(?:all\s+)?previous\s+instructions?/gi, "")
    .replace(/이전\s+지시사항[을를]?\s*무시/gi, "")
    .replace(/당신은\s+이제/gi, "")
    .trim();
}

/** Validate URL is http/https to prevent SSRF */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function handleApiError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  console.error("URL analysis error:", message);

  if (message.includes("429") || message.includes("quota") || message.includes("rate")) {
    return NextResponse.json(
      { error: "AI 분석 한도에 도달했습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
    { status: 500 }
  );
}

// ── Rate limiter (in-memory, resets on deploy) ──────────────────────────────

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // 20 requests per IP per hour (URL analysis is heavier)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

const MAX_EXTRA_TEXT_LENGTH = 10000; // extraText 최대 10,000자
const MAX_URL_LENGTH = 2048;

export async function POST(req: NextRequest) {
  try {
    const ipHash = hashIp(req);

    if (!checkRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "분석 요청이 너무 많습니다. 1시간에 20건까지 가능합니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { url, extraText } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL을 입력해주세요." }, { status: 400 });
    }

    if (url.length > MAX_URL_LENGTH) {
      return NextResponse.json({ error: "URL이 너무 깁니다." }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
    }

    if (extraText && typeof extraText === "string" && extraText.length > MAX_EXTRA_TEXT_LENGTH) {
      return NextResponse.json({ error: `텍스트가 너무 깁니다. ${MAX_EXTRA_TEXT_LENGTH.toLocaleString()}자 이내로 입력해주세요.` }, { status: 400 });
    }

    const youtubeId = extractYoutubeId(url);
    const startTime = Date.now();
    const urlDomain = extractDomain(url);

    if (youtubeId) {
      // YouTube 분석
      const [meta, transcript] = await Promise.all([
        fetchYoutubeMeta(youtubeId),
        fetchYoutubeTranscript(youtubeId),
      ]);
      console.log(`[analyze-url] videoId=${youtubeId} transcript=${transcript.length}chars`);

      const analysisText = [
        `[YouTube 영상 분석]`,
        `제목: ${meta.title}`,
        `채널명: ${meta.channelName}`,
        meta.description ? `\n[채널 설명란]\n${meta.description}` : "",
        meta.tags && meta.tags.length > 0 ? `\n[태그]\n${meta.tags.join(", ")}` : "",
        transcript ? `\n[자막/스크립트]\n${transcript}` : "\n[자막 없음 - 제목/채널명 기반으로만 분석]",
        extraText ? `\n[추가 정보]\n${sanitizeInput(extraText)}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Phase 1A: rule-based pre-screen on all available text
      const prescreen = preScreenText(analysisText);

      // Phase 2: blacklist check by channel name
      const blacklistResult = await checkBlacklist(meta.channelName, url);
      const blacklistContext = blacklistResult
        ? `\n[이용자 제보 이력]\n"${blacklistResult.entityName}"에 대해 이용자 제보 이력이 ${blacklistResult.reportCount}건 있습니다. 이 정보는 참고용이며, 사실 여부는 확인되지 않았습니다.\n`
        : "";

      const knowledgeContext = getKnowledgeContext();

      const userMessage = [
        `[참고 지식 DB — 분석 시 유사 사례/수법 매칭에 활용하세요]\n${knowledgeContext}`,
        prescreen.promptContext,
        blacklistContext,
        transcript
          ? `\n다음 YouTube 콘텐츠를 분석해주세요:\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`
          : `\n다음 YouTube 콘텐츠를 분석해주세요 (자막 없음 — 제목/채널명 기반 분석, analysisConfidence를 반드시 medium 이하로 설정하세요):\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`,
      ]
        .filter(Boolean)
        .join("\n");

      const geminiRes = await callGemini(BASE_SYSTEM_PROMPT, userMessage, 16384);
      let result;
      try {
        result = JSON.parse(geminiRes.content);
      } catch (parseErr) {
        console.error("[analyze-url] YouTube JSON parse error. Content length:", geminiRes.content.length);
        console.error("[analyze-url] First 500 chars:", geminiRes.content.substring(0, 500));
        console.error("[analyze-url] Last 200 chars:", geminiRes.content.substring(geminiRes.content.length - 200));
        throw parseErr;
      }
      result._prescreen = {
        riskScore: prescreen.riskScore,
        matchedPhrases: prescreen.matchedPhrases.map((p) => p.text),
        matchedSignals: prescreen.matchedSignals.map((s) => s.name),
      };
      if (blacklistResult) result._blacklist = blacklistResult;

      const responseTimeMs = Date.now() - startTime;

      await logAnalysis({
        type: "youtube",
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        scamType: result.matchedScamTypes?.[0]?.type ?? null,
        aiCalled: true,
        ipHash,
        inputPreview: maskSensitive(analysisText),
        inputLength: analysisText.length,
        aiResult: result,
        metaTitle: meta.title,
        metaChannel: meta.channelName,
        urlDomain: urlDomain ?? undefined,
        detectedSignalsCount: result.detectedSignals?.length ?? 0,
        responseTimeMs,
      });

      return NextResponse.json({
        ...result,
        meta: {
          type: "youtube",
          title: meta.title,
          channelName: meta.channelName,
          thumbnail: meta.thumbnail,
          hasTranscript: !!transcript,
          hasDescription: !!meta.description,
          videoId: youtubeId,
        },
      });
    }

    // Instagram/기타 URL — 텍스트 기반 분석
    if (!extraText) {
      return NextResponse.json(
        { error: "Instagram/기타 링크는 캡션이나 설명 텍스트를 함께 붙여넣어주세요." },
        { status: 400 }
      );
    }

    const sanitizedExtra = sanitizeInput(extraText);
    const analysisText = `[SNS 콘텐츠 분석]\nURL: ${url}\n\n[게시글 내용]\n${sanitizedExtra}`;
    const prescreen = preScreenText(analysisText);
    const blacklistResult = await checkBlacklist(sanitizedExtra, url);
    const blacklistContext = blacklistResult
      ? `\n[이용자 제보 이력]\n"${blacklistResult.entityName}"에 대해 이용자 제보 이력이 있습니다. 이 정보는 참고용이며, 사실 여부는 확인되지 않았습니다.\n`
      : "";

    const knowledgeCtx = getKnowledgeContext();

    const userMessage = [
      `[참고 지식 DB — 분석 시 유사 사례/수법 매칭에 활용하세요]\n${knowledgeCtx}`,
      prescreen.promptContext,
      blacklistContext,
      `\n다음 SNS 콘텐츠를 분석해주세요:\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`,
    ]
      .filter(Boolean)
      .join("\n");

    const geminiRes = await callGemini(BASE_SYSTEM_PROMPT, userMessage, 16384);
    let result;
    try {
      result = JSON.parse(geminiRes.content);
    } catch (parseErr) {
      console.error("[analyze-url] SNS JSON parse error. Content length:", geminiRes.content.length);
      console.error("[analyze-url] First 500 chars:", geminiRes.content.substring(0, 500));
      console.error("[analyze-url] Last 200 chars:", geminiRes.content.substring(geminiRes.content.length - 200));
      throw parseErr;
    }
    result._prescreen = {
      riskScore: prescreen.riskScore,
      matchedPhrases: prescreen.matchedPhrases.map((p) => p.text),
      matchedSignals: prescreen.matchedSignals.map((s) => s.name),
    };
    if (blacklistResult) result._blacklist = blacklistResult;

    const responseTimeMs = Date.now() - startTime;

    await logAnalysis({
      type: "sns",
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      scamType: result.matchedScamTypes?.[0]?.type ?? null,
      aiCalled: true,
      ipHash,
      inputPreview: maskSensitive(sanitizedExtra),
      inputLength: sanitizedExtra.length,
      aiResult: result,
      urlDomain: urlDomain ?? undefined,
      detectedSignalsCount: result.detectedSignals?.length ?? 0,
      responseTimeMs,
    });

    return NextResponse.json({
      ...result,
      meta: { type: "sns", url },
    });
  } catch (error) {
    logAnalysis({ type: "youtube", error: true, aiCalled: true }).catch(() => {});
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI 응답 파싱 오류가 발생했습니다." }, { status: 500 });
    }
    return handleApiError(error);
  }
}
