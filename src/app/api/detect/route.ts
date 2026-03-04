import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";

const BASE_SYSTEM_PROMPT = `당신은 한국의 사기 강연·교육·투자 서비스를 판별하는 전문 AI 분석관입니다.

사용자가 제공한 텍스트(광고 문구, 강의 소개, 투자 제안 등)를 분석하여 사기 가능성을 평가합니다.

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
    {
      "type": "사기 유형명",
      "similarity": "high|medium|low",
      "reason": "해당 유형과 유사한 이유"
    }
  ],
  "detectedSignals": [
    {
      "signal": "감지된 위험 신호명",
      "evidence": "텍스트에서 실제 발견된 문구 또는 패턴",
      "severity": "critical|high|medium|low"
    }
  ],
  "safeAspects": ["안전 요소 (있을 경우)"],
  "recommendation": "구체적인 행동 권고사항",
  "reportTo": ["신고 기관 (해당 시)"]
}

점수 기준:
- 0-20: safe (안전)
- 21-40: low (낮은 위험)
- 41-60: medium (주의)
- 61-80: high (위험)
- 81-100: critical (극도 위험)

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

function buildSafeResponse(text: string) {
  return {
    riskScore: 10,
    riskLevel: "safe",
    verdict: "안전",
    summary: "분석한 텍스트에서 사기 패턴이 감지되지 않았습니다. 로컬 규칙 기반 1차 분석 결과 위험 신호가 없어 AI 심층 분석을 생략했습니다.",
    matchedScamTypes: [],
    detectedSignals: [],
    safeAspects: ["알려진 미끼 문구 없음", "위험 신호 미감지"],
    recommendation: "현재까지는 특별한 위험이 감지되지 않았습니다. 그러나 언제나 결제 전 약관과 환불 규정을 확인하세요.",
    reportTo: [],
    _prescreenSkipped: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "분석할 텍스트를 입력해주세요." }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "텍스트가 너무 깁니다. 5000자 이내로 입력해주세요." }, { status: 400 });
    }

    // Phase 1A: local rule-based pre-screen
    const prescreen = preScreenText(text);

    if (!prescreen.shouldCallGPT) {
      return NextResponse.json(buildSafeResponse(text));
    }

    // Phase 2: blacklist check (graceful: no-op if Supabase not configured)
    const blacklistResult = await checkBlacklist(text);
    const blacklistContext = blacklistResult
      ? `\n[블랙리스트 경고]\n운영자/채널 "${blacklistResult.entityName}"이 블랙리스트에 등록된 사기 사례입니다. (신고 ${blacklistResult.reportCount}건, 사기유형: ${blacklistResult.scamType})\n`
      : "";

    const systemPrompt = `${BASE_SYSTEM_PROMPT}`;
    const userMessage = [
      prescreen.promptContext,
      blacklistContext,
      `\n다음 텍스트를 분석해주세요:\n\n${text}`,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response");

    const result = JSON.parse(content);

    // Attach prescreen metadata
    result._prescreen = {
      riskScore: prescreen.riskScore,
      matchedPhrases: prescreen.matchedPhrases.map((p) => p.text),
      matchedSignals: prescreen.matchedSignals.map((s) => s.name),
    };

    if (blacklistResult) {
      result._blacklist = blacklistResult;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI 응답 파싱 오류가 발생했습니다." }, { status: 500 });
    }
    console.error("Detection error:", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
