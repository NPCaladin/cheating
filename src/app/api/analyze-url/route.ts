import OpenAI from "openai";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractYoutubeId, fetchYoutubeMeta, fetchYoutubeTranscript } from "@/lib/youtube";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";
import { logAnalysis } from "@/lib/log-analysis";

const BASE_SYSTEM_PROMPT = `당신은 한국의 사기 강연·교육·투자 서비스를 판별하는 전문 AI 분석관입니다.

YouTube 영상 또는 SNS 콘텐츠의 제목, 채널명, 자막/스크립트를 분석하여 사기 가능성을 평가합니다.

## 분석 기준 (15개 사기 유형)
### 투자/재테크 사기
- 주식 리딩방/유료 종목 추천: VIP 회원, 종목 선공개, 선행매매
- 코인/가상화폐 리딩방: 스테이킹 고수익, 상장 전 코인
- FX마진/해외선물 리딩방: 자동매매, 레버리지 과장
- AI 자동매매: AI 빙자 수익 보장

### 강연/교육 사기
- 성공팔이: 과장된 성공 스토리, 고가 코칭 업셀링
- 고액 온라인 부업 강의: 월 수백만원 약속, 강의만으로 수익
- 코딩/부트캠프: 취업률 조작, 6개월 개발자
- 민간자격증: 국가공인 혼동, 취업 보장
- 보상형 플랫폼: 미션 후 현금 지급, 선납 후 먹튀

### 부업/커머스 사기
- 팀미션/SNS 부업: 10초에 5천원, SNS 좋아요 알바
- 스마트스토어: 대리운영 사기, 허위 수익
- 해외구매대행/아마존: 아마존 사칭, 재고 선납

### 부동산/다단계/기타
- 부동산 강연: 개발 호재 과장, 미등록 중개
- 다단계: 지인 모집 수익, 의무 구매
- 로또/도박: 픽스터, 예측 서비스

## 10대 위험 신호
1. 수익 보장 (원금보장, 수익보장)
2. 비현실적 수익률 (연 50%+)
3. 즉석 결정 강요 (오늘만, 선착순)
4. 초기 소액 성공 후 대금 유도
5. 단계적 업셀링
6. 자격/이력 검증 불가
7. 후기/댓글 조작 징후
8. 환불 규정 불명확
9. 다단계 구조
10. 출금 차단/추가 입금 요구

## 응답 형식 (반드시 JSON으로만 응답)
{
  "riskScore": 0-100,
  "riskLevel": "safe|low|medium|high|critical",
  "verdict": "안전|주의|위험|매우 위험|극도 위험",
  "summary": "2-3문장 핵심 판정 요약",
  "matchedScamTypes": [
    { "type": "사기 유형명", "similarity": "high|medium|low", "reason": "해당 유형과 유사한 이유" }
  ],
  "detectedSignals": [
    { "signal": "감지된 위험 신호명", "evidence": "실제 발견된 문구 또는 패턴", "severity": "critical|high|medium|low" }
  ],
  "safeAspects": ["안전 요소 (있을 경우)"],
  "recommendation": "구체적인 행동 권고사항",
  "reportTo": ["신고 기관 (해당 시)"]
}

점수 기준: 0-20 safe / 21-40 low / 41-60 medium / 61-80 high / 81-100 critical
JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

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

function handleOpenAIError(error: unknown): NextResponse {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    if (status === 429) {
      return NextResponse.json(
        { error: "AI 분석 한도에 도달했습니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }
    if (status === 401) {
      return NextResponse.json(
        { error: "AI 서비스 설정 오류입니다. 관리자에게 문의해주세요." },
        { status: 500 }
      );
    }
  }
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  console.error("URL analysis error:", message);
  return NextResponse.json(
    { error: `분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.` },
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
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
        ? `\n[블랙리스트 경고]\n채널 "${blacklistResult.entityName}"이 블랙리스트에 등록된 사기 사례입니다. (신고 ${blacklistResult.reportCount}건)\n`
        : "";

      const userMessage = [
        prescreen.promptContext,
        blacklistContext,
        transcript
          ? `\n다음 YouTube 콘텐츠를 분석해주세요:\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`
          : `\n다음 YouTube 콘텐츠를 분석해주세요 (자막 없음 — 제목/채널명 기반 분석, 정확도가 낮을 수 있습니다):\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`,
      ]
        .filter(Boolean)
        .join("\n");

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty response");

      const result = JSON.parse(content);
      result._prescreen = {
        riskScore: prescreen.riskScore,
        matchedPhrases: prescreen.matchedPhrases.map((p) => p.text),
        matchedSignals: prescreen.matchedSignals.map((s) => s.name),
      };
      if (blacklistResult) result._blacklist = blacklistResult;

      logAnalysis({
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
      ? `\n[블랙리스트 경고]\n"${blacklistResult.entityName}"이 블랙리스트에 등록된 사기 사례입니다.\n`
      : "";

    const userMessage = [
      prescreen.promptContext,
      blacklistContext,
      `\n다음 SNS 콘텐츠를 분석해주세요:\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BASE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response");

    const result = JSON.parse(content);
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
    return handleOpenAIError(error);
  }
}
