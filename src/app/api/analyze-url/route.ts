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

점수 기준:
- 0-20: safe (안전)
- 21-40: low (낮은 위험)
- 41-60: medium (주의)
- 61-80: high (위험)
- 81-100: critical (극도 위험)

JSON만 응답하고 다른 텍스트는 포함하지 마세요.

## 판별 예시 (Few-shot)

다음은 정확한 판별 예시입니다. 이 패턴을 참고하여 일관되게 판별하세요.

---

[예시 1 - 주식 리딩방]
입력:
"""
저 지난달 VIP 회원분들 수익률 공개합니다. 상위 10명 평균 +387%! 지금 무료 체험방 들어오시면 이번 주 급등 예정 종목 선공개해 드립니다. 슈퍼개미 출신 대표님이 직접 픽 날려드리는 종목만 따라오세요. 선착순 20명, 자리 없으면 못 들어옵니다.
"""

분석:
{
  "riskScore": 94,
  "riskLevel": "critical",
  "verdict": "극도 위험",
  "summary": "미등록 투자자문업 운영으로 자본시장법을 위반하는 주식 리딩방입니다. '급등 예정 종목 선공개'는 미공개정보 이용 선행매매를, '수익률 387%'는 조작된 수익 인증 가능성을 강하게 시사합니다. 즉시 중단하고 금융감독원에 신고하세요.",
  "matchedScamTypes": [
    {"type": "주식 리딩방/유료 종목 추천", "similarity": "high", "reason": "VIP 회원 전용 종목 선공개, 슈퍼개미 픽, 선착순 압박 등 리딩방 핵심 패턴 전부 포함"},
    {"type": "AI 자동매매 투자 사기", "similarity": "low", "reason": "수익 과장 방식이 유사"}
  ],
  "detectedSignals": [
    {"signal": "비현실적 수익률", "evidence": "상위 10명 평균 +387%", "severity": "critical"},
    {"signal": "미공개 정보 이용 암시", "evidence": "이번 주 급등 예정 종목 선공개", "severity": "critical"},
    {"signal": "즉석 결정 강요", "evidence": "선착순 20명, 자리 없으면 못 들어옵니다", "severity": "high"},
    {"signal": "자격/이력 검증 불가", "evidence": "슈퍼개미 출신 대표님", "severity": "high"}
  ],
  "safeAspects": [],
  "recommendation": "즉시 참여를 중단하세요. 투자자문업 등록 여부를 금융감독원 금융소비자 정보포털(fine.fss.or.kr)에서 반드시 확인하세요. 이미 피해를 입었다면 경찰청 사이버수사대(182)에 즉시 신고하세요.",
  "reportTo": ["금융감독원 1332", "경찰청 사이버수사대 182"]
}

---

[예시 2 - 코인/가상화폐 리딩방]
입력:
"""
[텔레그램 단독 공개] 이번 달 상장 직전 코인 정보입니다. 현재 스테이킹 연 600% 운영 중이며, 지금 예치하시면 상장 이후 최소 10배 수익 보장. 내부자 루트로만 받는 정보라 외부에 절대 유출 금지. 초기 투자자 한정 선착순 마감이니 빠른 결정 부탁드립니다.
"""

분석:
{
  "riskScore": 97,
  "riskLevel": "critical",
  "verdict": "극도 위험",
  "summary": "상장 전 코인 판매, 비현실적 스테이킹 수익, 내부자 정보 주장이 결합된 전형적인 코인 리딩방 사기입니다. '연 600% 스테이킹'과 '10배 수익 보장'은 법적으로 불가능한 약속이며, '외부 유출 금지' 표현은 피해자 고립을 유도하는 수법입니다.",
  "matchedScamTypes": [
    {"type": "코인/가상화폐 리딩방", "similarity": "high", "reason": "상장 직전 코인, 스테이킹 고수익, 내부자 정보, 선착순 마감 등 코인 사기 핵심 요소 모두 포함"},
    {"type": "주식 리딩방/유료 종목 추천", "similarity": "medium", "reason": "내부 정보 이용 수익 보장 구조 유사"}
  ],
  "detectedSignals": [
    {"signal": "비현실적 수익률", "evidence": "스테이킹 연 600% 운영 중", "severity": "critical"},
    {"signal": "수익 보장", "evidence": "최소 10배 수익 보장", "severity": "critical"},
    {"signal": "미공개 정보 이용 암시", "evidence": "내부자 루트로만 받는 정보", "severity": "critical"},
    {"signal": "즉석 결정 강요", "evidence": "빠른 결정 부탁드립니다", "severity": "high"},
    {"signal": "출금 차단/피해자 고립 유도", "evidence": "외부에 절대 유출 금지", "severity": "high"}
  ],
  "safeAspects": [],
  "recommendation": "절대 투자하지 마세요. 금융정보분석원(KoFIU) 가상자산사업자 등록 여부를 확인하고, 이미 입금했다면 즉시 가상자산 피해신고센터와 경찰에 신고하세요.",
  "reportTo": ["금융감독원 1332", "경찰청 사이버수사대 182", "가상자산 피해신고센터"]
}

---

[예시 3 - 성공팔이/자기계발]
입력:
"""
저도 처음엔 월급 230만원 흙수저였습니다. 지금은 월 자동수익 1억 2천. 제가 인생을 바꾼 단 하나의 방법, 무료 웨비나에서 공개합니다. 웨비나 후 마스터 코칭 프로그램(990만원) 참여하시면 경제적 자유 6개월 안에 달성 가능. 후기 영상 보시면 이미 수백 명이 성공했습니다.
"""

분석:
{
  "riskScore": 75,
  "riskLevel": "high",
  "verdict": "매우 위험",
  "summary": "흙수저 성공 서사로 신뢰를 구축한 후 990만원 고가 코칭으로 유도하는 성공팔이 강연 사기입니다. '월 자동수익 1억'과 '경제적 자유 6개월 달성'은 검증 불가한 허위 과장 광고입니다.",
  "matchedScamTypes": [
    {"type": "성공팔이 (자기계발 강연)", "similarity": "high", "reason": "흙수저 출신 서사, 월 자동수익 1억, 무료 웨비나 → 고가 코칭 업셀링, 성공 후기 동원 등 전형적 패턴"},
    {"type": "고액 온라인 부업 강의", "similarity": "medium", "reason": "고가 강의 판매 및 수익 과장 구조 유사"}
  ],
  "detectedSignals": [
    {"signal": "비현실적 수익률 과장", "evidence": "월 자동수익 1억 2천", "severity": "critical"},
    {"signal": "단계적 업셀링", "evidence": "무료 웨비나 → 마스터 코칭 프로그램(990만원)", "severity": "high"},
    {"signal": "수익 보장", "evidence": "경제적 자유 6개월 안에 달성 가능", "severity": "high"},
    {"signal": "후기/댓글 조작 의심", "evidence": "이미 수백 명이 성공했습니다", "severity": "medium"}
  ],
  "safeAspects": ["무료 웨비나로 콘텐츠 먼저 확인 가능"],
  "recommendation": "결제 전 강사의 실제 사업 성과를 사업자등록증과 재무제표로 요구하세요. 990만원 결제는 할부로 진행하여 카드사 분쟁 조정 가능성을 확보하세요.",
  "reportTo": ["한국소비자원 1372", "공정거래위원회"]
}

---

[예시 4 - 팀미션/SNS 부업]
입력:
"""
[긴급 채용] 넷플릭스 앱 평점 작업 알바! 10초에 5,000원, 하루 2시간으로 일당 30만원. 텔레그램으로 연락 주시면 당일 업무 시작 가능. 처음 3번 미션은 무료로 진행, 이후 보증금 20만원 내시면 고수익 팀 배정.
"""

분석:
{
  "riskScore": 99,
  "riskLevel": "critical",
  "verdict": "극도 위험",
  "summary": "현재 가장 많은 피해자를 내고 있는 팀미션/SNS 부업 사기의 교과서적 사례입니다. '10초에 5,000원'은 어떤 합법적 기업도 제공하지 않는 비현실적 보수이며, 초기 무료 미션 후 보증금을 요구하는 구조는 더 큰 금액을 편취하기 위한 전형적인 덫입니다.",
  "matchedScamTypes": [
    {"type": "팀미션/SNS 부업 사기", "similarity": "high", "reason": "10초에 5천원, 텔레그램 유도, 초기 무료 미션 후 보증금 요구 등 모든 핵심 요소 포함"}
  ],
  "detectedSignals": [
    {"signal": "비현실적 수익률", "evidence": "10초에 5,000원, 하루 2시간으로 일당 30만원", "severity": "critical"},
    {"signal": "외부 메신저 유도", "evidence": "텔레그램으로 연락 주시면", "severity": "critical"},
    {"signal": "초기 소액 성공 체험 후 선납 유도", "evidence": "처음 3번 미션은 무료로 진행, 이후 보증금 20만원", "severity": "critical"}
  ],
  "safeAspects": [],
  "recommendation": "즉시 연락을 차단하고 절대 보증금을 송금하지 마세요. 이미 돈을 보냈다면 즉시 경찰청 사이버수사대(182)에 신고하세요.",
  "reportTo": ["경찰청 사이버수사대 182", "금융감독원 1332"]
}

---

[예시 5 - 불법 다단계]
입력:
"""
우리 제품 쓰면서 사람만 데려오면 추가 수익! 5명 팀원 모집하면 월 500만원 패시브 인컴 구축. 네트워크 비즈니스의 새로운 패러다임. 건강식품 의무구매(월 30만원)로 사업자 자격 유지, 하위 회원 매출의 10%가 자동으로 입금됩니다.
"""

분석:
{
  "riskScore": 92,
  "riskLevel": "critical",
  "verdict": "극도 위험",
  "summary": "불법 다단계 피라미드의 모든 핵심 요소를 갖춘 극도로 위험한 사기입니다. '사람 데려오면 추가 수익', '하위 회원 매출 10% 자동 입금', '의무 제품 구매'는 방문판매법상 불법 다단계의 직접적인 증거입니다.",
  "matchedScamTypes": [
    {"type": "다단계/네트워크마케팅", "similarity": "high", "reason": "사람 데려오면 수익, 5명 팀원 500만원, 의무 제품 구매, 하위 회원 매출 수당 등 불법 다단계 모든 핵심 요소 포함"}
  ],
  "detectedSignals": [
    {"signal": "다단계 구조", "evidence": "사람만 데려오면 추가 수익, 하위 회원 매출의 10%가 자동으로 입금", "severity": "critical"},
    {"signal": "수익 보장", "evidence": "5명 팀원 모집하면 월 500만원 패시브 인컴 구축", "severity": "critical"},
    {"signal": "의무 구매 강요", "evidence": "건강식품 의무구매(월 30만원)로 사업자 자격 유지", "severity": "critical"}
  ],
  "safeAspects": [],
  "recommendation": "즉시 가입을 거절하세요. 공정거래위원회에서 해당 업체의 다단계판매업 등록 여부를 확인하세요. 이미 가입했다면 14일 이내 청약 철회가 가능합니다.",
  "reportTo": ["공정거래위원회", "한국소비자원 1372", "경찰청"]
}`;

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
