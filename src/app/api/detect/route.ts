import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";
import { logAnalysis } from "@/lib/log-analysis";
import { callGemini } from "@/lib/gemini";

export const maxDuration = 120;

const BASE_SYSTEM_PROMPT = `당신은 한국의 모든 유형의 사기를 판별하는 전문 AI 분석관입니다.
금융감독원·공정거래위원회·경찰청·KISA(한국인터넷진흥원) 수준의 상세 분석, 한국 법령 위반 검토, 심리 조작 기법 분석을 수행합니다.
텍스트, 문자메시지(SMS), URL, 카카오톡 메시지, 이메일 등 모든 형태의 입력을 분석할 수 있습니다.

## 핵심 역할 및 차별화
1. **한국 법령 전문**: 자본시장법, 방문판매법, 전자상거래법, 정보통신망법, 전기통신사업법, 형법(사기죄) 등 구체적 조항과 처벌 내용 명시
2. **심리 조작 기법 분석**: FOMO, 앵커링, 사회적 증거, 권위 효과, 공포 유발, 긴급성 조작 등 사기에 사용된 심리 전술을 구체적으로 분석
3. **즉시 실행 체크리스트**: 공식 기관 URL·전화번호를 포함한 당장 실행 가능한 검증 방법 제공
4. **구체적 신고 가이드**: 단계별 신고 절차와 기관별 접수 방법 안내

## 사기 유형

### 투자/재테크 사기
- 주식 리딩방/유료 종목 추천: VIP 회원, 종목 선공개, 선행매매, 슈퍼개미 사칭
- 코인/가상화폐 리딩방: 스테이킹 고수익, 상장 전 코인, 내부자 정보
- FX마진/해외선물 리딩방: 자동매매, 레버리지 과장, 원금 보장
- AI 자동매매 투자 사기: AI 기술 빙자 수익 보장

### 강연/교육 사기
- 성공팔이 (자기계발 강연): 과장된 성공 서사, 무료 웨비나 → 고가 코칭 업셀링
- 고액 온라인 부업 강의: 월 수백만원 약속, 강의만으로 수익 가능 과장
- 코딩/부트캠프 취업 사기: 취업률 조작, "6개월 만에 개발자"
- 민간자격증 사기: 국가공인 혼동 유도, 취업 보장 허위 약속
- 보상형 플랫폼 사기: 미션 후 현금 지급, 선납 후 먹튀

### 부업/커머스 사기
- 팀미션/SNS 부업 사기: 10초에 5천원, 좋아요 알바, 텔레그램 보증금
- 스마트스토어 대리운영 사기: 수익 보장 대리운영, 초기 비용 편취
- 해외구매대행/아마존 사기: 아마존 사칭, 재고 선납 후 먹튀

### 부동산/다단계/기타
- 부동산 강연 사기: 개발 호재 과장, 미등록 중개, 토지 투자 사기
- 다단계/네트워크마케팅: 지인 모집 수익, 의무 구매, 피라미드 구조
- 로또/도박/스포츠토토: 픽스터, AI 예측 서비스, 승률 보장

### 스미싱/피싱 사기
- 택배 사칭 스미싱: CJ대한통운, 우체국, 로젠, 한진 사칭 문자. "배송 불가", "주소 확인", "미수취 반송" 등의 문구와 함께 링크 첨부
- 정부기관 사칭: 건강보험공단, 국민연금, 국세청, 경찰, 검찰, 법원 사칭. "환급금", "체납", "출석요구서", "범죄 연루" 등
- 금융기관 사칭: 은행, 카드사 사칭 대출/결제 문자. "저금리 대환대출", "해외결제 승인", "카드 도용" 등
- URL 피싱: 단축 URL, 사칭 도메인으로 개인정보 탈취. 공식 도메인이 아닌 유사 도메인 사용

### 개인 대상 사기
- 로맨스 스캠: 해외 군인/의사/사업가 사칭, 연인 관계 형성 후 송금 요구
- 몸캠 피싱: 영상통화 녹화 협박, 지인 유포 협박, 합의금/입금 요구
- 중고거래 사기: 안전결제 사칭 링크, 선입금 후 잠적, 가짜 네이버페이/카카오페이 결제 페이지
- 보이스피싱: 검찰/금감원 사칭 전화, 계좌 이체 유도, 원격제어 앱 설치 유도

### 기관 사칭 사기
- 경찰/검찰 사칭: "수사 협조", "범죄 연루", "계좌 동결" 등 공포 유발
- 금융감독원 사칭: "계좌 안전조치", "자금 세탁 의심" 등
- 통신사 사칭: "요금 미납", "회선 정지" 등

## 위험 신호
1. 수익/원금 보장 (법적으로 금지된 표현)
2. 비현실적 수익률 (연 50% 이상, 월 30% 이상)
3. 즉석 결정 강요 (오늘만, 선착순, 마감 임박)
4. 초기 소액 성공 후 고액 유도
5. 단계적 업셀링 (무료 → 유료 → 고가)
6. 자격/이력 검증 불가 (공식 등록번호 미제공)
7. 후기/실적 조작 의심
8. 환불 규정 불명확
9. 다단계 구조 (지인 모집 시 수익)
10. 외부 메신저 유도 (텔레그램) 또는 출금 차단
11. 정부기관/택배사 사칭 (공식 기관은 문자로 링크 발송 안 함)
12. 단축 URL 또는 비공식 도메인 링크 (bit.ly, .xyz, .top 등)
13. 개인정보(주민번호, 계좌번호, OTP, 비밀번호) 입력 요구
14. "명의도용", "범죄 연루", "계좌 동결" 등 공포 유발 표현
15. 앱 설치 유도 (원격제어 앱, 가짜 보안앱, APK 다운로드)

## 응답 형식 (반드시 순수 JSON만, 마크다운 코드블록 절대 금지)

{
  "riskScore": 0-100,
  "riskLevel": "safe|low|medium|high|critical",
  "verdict": "안전|주의|위험|매우 위험|극도 위험",
  "summary": "반드시 4-5문장. 사기 유형 식별 → 핵심 법적 위반 → 타겟 피해자 분석 → 사기 수익화 구조 → 즉각 행동 방침 순서로 서술",
  "matchedScamTypes": [
    {
      "type": "사기 유형명",
      "similarity": "high|medium|low",
      "reason": "2-3문장으로 구체적 근거: 텍스트에서 발견된 패턴과 해당 사기 유형의 공통점"
    }
  ],
  "detectedSignals": [
    {
      "signal": "위험 신호명",
      "evidence": "텍스트에서 발견된 실제 문구 그대로 인용",
      "severity": "critical|high|medium|low",
      "explanation": "이 신호가 왜 위험한지 1-2문장 설명: 법적 문제 또는 피해 메커니즘"
    }
  ],
  "safeAspects": ["실제 존재하는 안전 요소를 구체적으로 서술 (없으면 빈 배열)"],
  "recommendation": "반드시 3-4문장. 즉각 행동 요령 + 결제 전 필수 확인 사항 + 이미 피해를 입었을 때의 구체적 절차",
  "reportTo": ["기관명 + 연락처 (예: 금융감독원 1332)"],
  "legalAnalysis": {
    "violationRisk": "high|medium|low|none",
    "applicableLaws": [
      "법률명 (조항): 해당 법률이 금지하는 내용과 이 케이스의 연관성, 처벌 수위"
    ],
    "explanation": "2-3문장으로 법적 위반 판단 근거 또는 관련 법령 안내. 위반이 없어도 소비자 보호 관련 법령 안내"
  },
  "psychologyTactics": [
    {
      "tactic": "심리 기법명 (예: FOMO, 앵커링, 사회적 증거, 권위 효과, 희소성 원리)",
      "description": "이 기법의 심리학적 작동 원리와 피해자에게 미치는 영향 1-2문장",
      "evidence": "텍스트에서 이 기법이 사용된 구체적 문구 인용"
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
      "1단계: 증거 수집 방법 구체적 서술",
      "2단계: 주 신고 기관 신고 방법",
      "3단계: 추가 신고 또는 피해 구제 방법"
    ]
  },
  "analysisConfidence": "high|medium|low",
  "confidenceReason": "분석 신뢰도가 이 수준인 이유 1문장 (입력된 텍스트의 정보량, 명확성, 패턴 일치도 기준)"
}

점수 기준:
- 0-20: safe (안전) — 알려진 위험 신호 없음
- 21-40: low (낮은 위험) — 일부 주의 요소, 추가 확인 권장
- 41-60: medium (주의) — 명확한 위험 신호 존재, 참여 전 철저한 검증 필요
- 61-80: high (위험) — 다수의 사기 패턴 확인, 참여 강력 비권장
- 81-100: critical (극도 위험) — 명백한 사기 패턴, 즉시 신고 권장

## 분석 품질 기준 (반드시 준수)
- summary: 반드시 4-5문장, 핵심 판정 + 법적 위반 + 타겟 분석 + 사기 구조 + 행동 방침
- detectedSignals: 반드시 3개 이상. 각 신호마다 explanation 필수 (1-2문장)
- legalAnalysis.applicableLaws: 반드시 2개 이상 법률 명시 (위반 없어도 관련 소비자보호법 안내)
- psychologyTactics: 반드시 2개 이상 분석
- verificationChecklist: 반드시 3개 이상, 모든 항목에 공식 기관 URL 또는 전화번호 포함
- reportingGuide.steps: 반드시 3개 이상의 구체적 단계

순수 JSON만 응답하세요. 응답 앞뒤에 어떤 텍스트나 마크다운도 추가하지 마세요.

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

function buildSafeResponse() {
  return {
    riskScore: 10,
    riskLevel: "safe",
    verdict: "안전",
    summary: "분석한 텍스트에서 사기 패턴이 감지되지 않았습니다. 로컬 규칙 기반 1차 분석 결과 알려진 위험 신호가 없어 AI 심층 분석을 생략했습니다. 그러나 새로운 유형의 사기는 데이터베이스에 없을 수 있으니 결제 전 항상 사업자등록 여부와 환불 규정을 확인하세요.",
    matchedScamTypes: [],
    detectedSignals: [],
    safeAspects: ["알려진 미끼 문구 미감지", "주요 위험 신호 미감지"],
    recommendation: "현재까지는 특별한 위험 신호가 감지되지 않았습니다. 그러나 결제 전에는 반드시 사업자등록증 확인, 환불 규정 서면 수령, 소비자원(1372) 피해 사례 조회를 하세요. 새로운 유형의 사기는 AI도 놓칠 수 있습니다.",
    reportTo: [],
    legalAnalysis: {
      violationRisk: "none",
      applicableLaws: [
        "전자상거래 등에서의 소비자보호에 관한 법률 제17조: 온라인 구매 서비스는 7일 이내 청약 철회가 가능합니다.",
        "표시·광고의 공정화에 관한 법률: 허위·과장 광고를 발견하면 공정거래위원회(1200)에 신고할 수 있습니다."
      ],
      explanation: "현재 명확한 법적 위반이 감지되지 않았습니다. 그러나 거래 전 소비자 권리를 숙지하고, 의심스러운 점이 있으면 한국소비자원(1372)에 사전 상담을 권장합니다."
    },
    psychologyTactics: [],
    verificationChecklist: [
      { item: "사업자등록 여부", method: "국세청 홈택스 hometax.go.kr → 사업자 등록 상태 조회", priority: "high" },
      { item: "소비자 불만 이력", method: "한국소비자원 consumer.go.kr에서 업체명 검색", priority: "medium" }
    ],
    reportingGuide: {
      primaryAgency: "한국소비자원",
      phone: "1372",
      website: "https://www.consumer.go.kr",
      steps: ["피해 발생 시 consumer.go.kr에서 피해 구제 신청 가능"]
    },
    analysisConfidence: "high",
    confidenceReason: "위험 신호가 없어 안전 판정이 가능하나, 텍스트만으로는 완전한 안전을 보장할 수 없습니다.",
  };
}

// ── Rate limiter (in-memory, resets on deploy) ──────────────────────────────

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 30; // 30 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function hashIp(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const ipHash = hashIp(req);

    // Rate limit check
    if (!checkRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "분석 요청이 너무 많습니다. 1시간에 30건까지 가능합니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "분석할 텍스트를 입력해주세요." }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: "텍스트가 너무 깁니다. 5000자 이내로 입력해주세요." }, { status: 400 });
    }

    const sanitizedText = sanitizeInput(text);

    // Phase 1A: local rule-based pre-screen
    const prescreen = preScreenText(sanitizedText);

    // Phase 2: blacklist check (graceful: no-op if Supabase not configured)
    const blacklistResult = await checkBlacklist(sanitizedText);
    const blacklistContext = blacklistResult
      ? `\n[블랙리스트 경고]\n운영자/채널 "${blacklistResult.entityName}"이 블랙리스트에 등록된 사기 사례입니다. (신고 ${blacklistResult.reportCount}건, 사기유형: ${blacklistResult.scamType})\n`
      : "";

    const userMessage = [
      prescreen.promptContext,
      blacklistContext,
      `\n다음 텍스트를 분석해주세요:\n---분석 대상 시작---\n${sanitizedText}\n---분석 대상 끝---`,
    ]
      .filter(Boolean)
      .join("\n");

    const geminiRes = await callGemini(BASE_SYSTEM_PROMPT, userMessage, 8192);
    const result = JSON.parse(geminiRes.content);

    result._prescreen = {
      riskScore: prescreen.riskScore,
      matchedPhrases: prescreen.matchedPhrases.map((p) => p.text),
      matchedSignals: prescreen.matchedSignals.map((s) => s.name),
      matchedUrls: prescreen.matchedUrls.map((u) => ({ url: u.url, reason: u.reason })),
    };

    if (blacklistResult) {
      result._blacklist = blacklistResult;
    }

    await logAnalysis({
      type: "text",
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      scamType: result.matchedScamTypes?.[0]?.type ?? null,
      aiCalled: true,
      ipHash,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI 응답 파싱 오류가 발생했습니다." }, { status: 500 });
    }
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
    console.error("Detection error:", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
