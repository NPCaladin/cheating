import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractYoutubeId, fetchYoutubeMeta, fetchYoutubeTranscript } from "@/lib/youtube";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";
import { logAnalysis } from "@/lib/log-analysis";
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

## 자막 직접 인용 규칙 (가장 중요)
자막이 제공된 경우, 다음 규칙을 반드시 준수하세요:
1. detectedSignals의 각 evidence에 자막 원문을 "큰따옴표"로 감싸서 인용
2. psychologyTactics의 각 evidence에도 자막 원문 직접 인용
3. transcriptAnalysis에 최소 5개의 문제 발언을 원문 그대로 인용
4. summary에서도 핵심 문제 발언 1-2개를 직접 인용하여 서술
5. 단순히 "수익 보장 표현 발견" 같은 추상적 설명 금지 → "저는 이 방법으로 월 3천만원을 벌고 있습니다" 같은 실제 발언 인용
6. 자막이 길 경우 전체를 훑어 초반/중반/후반에서 골고루 인용

## 응답 형식 (반드시 순수 JSON만, 마크다운 코드블록 절대 금지)

{
  "riskScore": 0-100,
  "riskLevel": "safe|low|medium|high|critical",
  "verdict": "안전|주의|확인 필요|높은 주의|즉시 확인 필요",
  "summary": "반드시 4-5문장. 채널 성격/타겟 분석 → 제목/콘텐츠 전략 → 발견된 위험 요소 → 법적 위반 가능성 → 시청자 행동 권고 순서로 서술",
  "matchedScamTypes": [
    {
      "type": "사기 유형명",
      "similarity": "high|medium|low",
      "reason": "2-3문장으로 구체적 근거: 채널명/제목/자막에서 발견된 패턴과 해당 사기 유형의 공통점"
    }
  ],
  "detectedSignals": [
    {
      "signal": "관찰된 패턴 또는 위험 신호명",
      "evidence": "제목/채널명/자막에서 발견된 실제 문구 그대로 인용",
      "severity": "critical|high|medium|low",
      "explanation": "이 패턴이 왜 위험하거나 주의가 필요한지 1-2문장 설명"
    }
  ],
  "safeAspects": ["실제 존재하는 안전 요소를 구체적으로 서술 (없으면 빈 배열)"],
  "recommendation": "반드시 3-4문장. 시청자 관점 행동 권고 + 채널 구독/결제 전 확인 사항 + 이미 피해를 입었을 때의 절차",
  "reportTo": ["기관명 + 연락처 (해당 시)"],
  "legalAnalysis": {
    "violationRisk": "high|medium|low|none",
    "applicableLaws": [
      "법률명 (조항): 해당 법률이 금지하는 내용과 이 콘텐츠의 연관성, 처벌 수위"
    ],
    "explanation": "2-3문장으로 법적 위반 판단 근거 또는 관련 법령 안내"
  },
  "psychologyTactics": [
    {
      "tactic": "심리 기법명 (예: 클릭베이트, FOMO, 호기심 갭, 사회적 증거)",
      "description": "이 기법의 심리학적 작동 원리와 시청자에게 미치는 영향 1-2문장",
      "evidence": "제목/채널명/자막에서 이 기법이 사용된 구체적 문구 인용"
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
    "primaryAgency": "가장 적합한 주 신고 기관명",
    "phone": "대표 신고 전화번호",
    "website": "공식 신고 페이지 URL",
    "steps": [
      "단계별 신고 절차 (최소 3단계)"
    ]
  },
  "analysisConfidence": "high|medium|low",
  "confidenceReason": "분석 신뢰도가 이 수준인 이유 1문장 (자막 유무, 채널 정보량, 패턴 일치도 기준)",
  "transcriptAnalysis": [
    {
      "quote": "자막에서 발견된 문제 발언 원문 (정확히 인용)",
      "timestamp": "영상 내 대략적 위치 (초반부/중반부/후반부)",
      "issue": "이 발언이 왜 문제인지 2-3문장으로 상세 설명",
      "scamPattern": "매칭되는 사기 패턴명 (15개 유형 중)",
      "severity": "critical|high|medium|low"
    }
  ]
}

점수 기준:
- 0-20: safe (안전) — 알려진 위험 패턴 미감지
- 21-40: low (낮은 주의) — 일부 주의 요소, 추가 확인 권장
- 41-60: medium (주의) — 위험 패턴 감지, 참여 전 철저한 검증 필요
- 61-80: high (높은 주의) — 다수의 위험 패턴 감지, 참여 전 반드시 검증 필요
- 81-100: critical (즉시 확인 필요) — 다수의 위험 패턴이 강하게 감지됨, 관련 기관에 확인 권장

## 분석 품질 기준 (반드시 준수)
- summary: 반드시 6-8문장. 채널 성격/타겟 → 자막 핵심 문제 발언 인용 → 사기 유형 매칭 근거 → 제목/콘텐츠 전략 → 법적 위반 가능성 → 피해 규모 추정 → 시청자 행동 권고 → 결론
- detectedSignals: 반드시 5개 이상. 각 evidence에 자막 원문을 큰따옴표로 직접 인용
- legalAnalysis.applicableLaws: 반드시 3개 이상 (조항번호 + 처벌 수위 포함)
- psychologyTactics: 반드시 3개 이상. evidence에 자막 원문 직접 인용 필수
- verificationChecklist: 반드시 4개 이상, 공식 기관 URL 또는 전화번호 포함
- transcriptAnalysis: 자막이 있을 경우 반드시 5개 이상의 문제 발언을 원문 인용하여 분석. 자막 없으면 빈 배열
- 자막 없이 분석 시: analysisConfidence를 반드시 "medium" 이하로 설정하고 confidenceReason에 명시

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

function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const ipHash = hashIp(req);
    const { url, extraText } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL을 입력해주세요." }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
    }

    const youtubeId = extractYoutubeId(url);

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

      await logAnalysis({
        type: "youtube",
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        scamType: result.matchedScamTypes?.[0]?.type ?? null,
        aiCalled: true,
        ipHash,
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

    logAnalysis({
      type: "sns",
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      scamType: result.matchedScamTypes?.[0]?.type ?? null,
      aiCalled: true,
      ipHash,
    });

    return NextResponse.json({
      ...result,
      meta: { type: "sns", url },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI 응답 파싱 오류가 발생했습니다." }, { status: 500 });
    }
    return handleApiError(error);
  }
}
