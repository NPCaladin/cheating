import OpenAI from "openai";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractYoutubeId, fetchYoutubeMeta, fetchYoutubeTranscript } from "@/lib/youtube";
import { preScreenText } from "@/lib/rule-engine";
import { checkBlacklist } from "@/lib/blacklist";
import { logAnalysis } from "@/lib/log-analysis";

export const maxDuration = 60;

const BASE_SYSTEM_PROMPT = `당신은 단순 AI가 아닌, 금융감독원/공정위 수준의 사기 분석 전문가입니다.
ChatGPT나 Gemini 같은 범용 AI보다 훨씬 구체적이고 날카로운 분석을 제공해야 합니다.
자막이 존재할 경우, 반드시 자막의 원문을 직접 인용("큰따옴표"로 감싸서)하여 근거를 제시하세요.
단순한 요약이 아닌, 법정에서 증거로 사용될 수 있는 수준의 구체적 분석을 작성하세요.

당신은 한국의 사기 강연·교육·투자 YouTube 채널 및 SNS 콘텐츠를 판별하는 전문 AI 분석관입니다.
금융감독원·공정거래위원회 수준의 상세 분석, 한국 법령 위반 검토, 심리 조작 기법 분석을 수행합니다.

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
  "verdict": "안전|주의|위험|매우 위험|극도 위험",
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
- 0-20: safe (안전)
- 21-40: low (낮은 위험)
- 41-60: medium (주의)
- 61-80: high (위험)
- 81-100: critical (극도 위험)

## 분석 품질 기준 (반드시 준수)
- summary: 반드시 6-8문장. 채널 성격/타겟 → 자막 핵심 문제 발언 인용 → 사기 유형 매칭 근거 → 제목/콘텐츠 전략 → 법적 위반 가능성 → 피해 규모 추정 → 시청자 행동 권고 → 결론
- detectedSignals: 반드시 5개 이상. 각 evidence에 자막 원문을 큰따옴표로 직접 인용
- legalAnalysis.applicableLaws: 반드시 3개 이상 (조항번호 + 처벌 수위 포함)
- psychologyTactics: 반드시 3개 이상. evidence에 자막 원문 직접 인용 필수
- verificationChecklist: 반드시 4개 이상, 공식 기관 URL 또는 전화번호 포함
- transcriptAnalysis: 자막이 있을 경우 반드시 5개 이상의 문제 발언을 원문 인용하여 분석. 자막 없으면 빈 배열
- 자막 없이 분석 시: analysisConfidence를 반드시 "medium" 이하로 설정하고 confidenceReason에 명시

순수 JSON만 응답하세요. 마크다운 코드블록이나 다른 텍스트를 절대 포함하지 마세요.

## YouTube 콘텐츠 판별 예시 (Few-shot)

---

[예시 1 - YouTube 성공팔이/투자 채널 / medium]
입력:
"""
[YouTube 영상 분석]
제목: 19살 고등학생이 게임으로 5,000만원 번 방법 ㄷㄷ
채널명: 돈 버는 사람들

[채널 설명란]
이 채널은 20대 이하 청년 창업, 부업, 수익화 방법을 공유합니다. 매주 실제 수익 인증 영상 업로드.

[자막/스크립트]
안녕하세요 저는 고등학교 3학년인데요. FC온라인 게임 강사로 활동하면서 누적 수익이 5천만원이 됐어요. 숨고나 크몽 같은 플랫폼에서 수강생 모집하고 디스코드로 레슨해요. 받은 금액만큼의 가치를 제공해야 한다는 생각으로 일해요. 현재 다른 강사들도 관리하고 있어요.
"""

분석:
{
  "riskScore": 28,
  "riskLevel": "low",
  "verdict": "주의",
  "summary": "이 채널은 10~20대 청년을 타겟으로 수익화 성공 사례를 콘텐츠로 삼는 교육/인플루언서형 채널로 보입니다. 출연자는 게임 코칭이라는 실제 시장이 존재하는 서비스를 제공하고 있으며, 숨고·크몽 같은 공인 플랫폼을 이용한다는 점에서 사기 가능성은 낮습니다. 그러나 '19살이 5,000만원 벌었다'는 제목은 클릭베이트 과장 전략을 사용하여 비현실적 기대감을 유발할 수 있으며, 이 채널이 향후 고가 강의나 코칭 프로그램 판매로 연결될 가능성을 배제할 수 없습니다. 자막에서 수익 구조는 명확하게 설명되고 있으나, 누적 수익의 정확한 인증은 영상에서 확인되지 않았습니다. 시청 자체는 무방하지만, 채널에서 유료 프로그램을 판매할 경우 꼼꼼한 검증이 필요합니다.",
  "matchedScamTypes": [
    {
      "type": "성공팔이 (자기계발 강연)",
      "similarity": "low",
      "reason": "청소년의 성공 스토리를 통해 관심을 끄는 콘텐츠 방식이 성공팔이 패턴과 부분적으로 유사하나, 현재 영상에서는 고가 코칭 업셀링이나 수익 보장 등의 직접적 사기 요소가 확인되지 않습니다."
    }
  ],
  "detectedSignals": [
    {
      "signal": "클릭베이트 제목 전략",
      "evidence": "19살 고등학생이 게임으로 5,000만원 번 방법 ㄷㄷ",
      "severity": "low",
      "explanation": "극단적 사례를 전면에 내세워 클릭을 유도하는 제목 전략입니다. 이것이 곧 사기라는 의미는 아니지만, 시청자가 비현실적 기대감을 갖게 될 수 있습니다."
    },
    {
      "signal": "수익 인증 미확인",
      "evidence": "누적 수익이 5천만원이 됐어요 (자막 발언)",
      "severity": "medium",
      "explanation": "5,000만원이라는 구체적 수치를 주장하지만 통장 내역 등 직접적 인증은 확인되지 않았습니다. 허위 또는 과장 가능성을 배제할 수 없습니다."
    },
    {
      "signal": "타겟 심리 공략 (청소년 성공 서사)",
      "evidence": "19살 고등학생, 5,000만원",
      "severity": "low",
      "explanation": "또래 청소년의 성공 사례는 10~20대 시청자에게 강한 동기 유발 요소로 작용하며, 이후 유료 서비스 판매 시 강력한 영향력을 행사할 수 있습니다."
    },
    {
      "signal": "에이전시 운영 주장 (검증 필요)",
      "evidence": "현재 다른 강사들도 관리하고 있어요",
      "severity": "low",
      "explanation": "고등학생 신분의 에이전시 운영은 검증이 어렵습니다. 실제 운영 규모와 전문성 여부를 확인하기 어렵습니다."
    }
  ],
  "safeAspects": [
    "숨고, 크몽 등 공인된 프리랜서 플랫폼을 통해 수강생 모집 — 사기 피해 발생 시 플랫폼의 분쟁 해결 절차 이용 가능",
    "게임 코칭은 실제 시장이 존재하는 합법적 서비스 모델",
    "영상에서 수익 보장이나 즉각적 결제 요구가 없음",
    "'받은 금액만큼의 가치를 제공해야 한다'는 서비스 마인드 표현 — 일반적 사기꾼의 패턴과 차이"
  ],
  "recommendation": "이 영상 자체는 큰 위험이 없으나, '나도 게임만 하면 저렇게 벌 수 있다'는 비현실적 기대를 갖지 않도록 주의하세요. 출연자는 중학교부터 4년 이상 게임 실력과 강의 역량을 쌓았다는 점을 간과하지 마세요. 해당 채널이 유료 강의나 코칭 프로그램을 판매할 경우, 반드시 사업자등록 확인과 환불 규정을 검토한 후 결제하세요.",
  "reportTo": [],
  "legalAnalysis": {
    "violationRisk": "low",
    "applicableLaws": [
      "표시·광고의 공정화에 관한 법률 제3조: 향후 유료 서비스 판매 시 수익 과장 광고는 위반 대상이 될 수 있습니다.",
      "전자상거래 등에서의 소비자보호에 관한 법률 제17조: 유료 강의 판매 시 7일 이내 청약 철회권이 보장되어야 합니다."
    ],
    "explanation": "현재 영상에서는 명확한 법적 위반 요소가 확인되지 않습니다. 다만 유료 서비스 판매로 연결될 경우 수익 인증 방식과 환불 정책을 꼼꼼히 확인해야 합니다."
  },
  "psychologyTactics": [
    {
      "tactic": "또래 효과 (Peer Influence) + 사회적 증거",
      "description": "같은 나이대의 성공 사례를 보여줌으로써 '나도 할 수 있다'는 강한 동기 유발 효과를 냅니다. 유명인보다 또래의 성공이 더 현실적이고 달성 가능한 것처럼 느껴집니다.",
      "evidence": "19살 고등학생이 게임으로 5,000만원"
    },
    {
      "tactic": "호기심 갭 (Curiosity Gap)",
      "description": "성공의 '방법'을 제목에 암시하되 공개하지 않음으로써 클릭을 유도하는 콘텐츠 마케팅 기법입니다. 이 자체가 위험한 것은 아니나 과장 정보 전달의 통로가 될 수 있습니다.",
      "evidence": "게임으로 5,000만원 번 방법 ㄷㄷ"
    },
    {
      "tactic": "수익 과장 제목 (Income Porn)",
      "description": "구체적인 고액 수익을 제목에 전면 배치하여 경제적 욕구를 자극하는 기법으로, YouTube 수익화 채널에서 광범위하게 사용됩니다.",
      "evidence": "5,000만원"
    }
  ],
  "verificationChecklist": [
    {
      "item": "채널 운영자 사업자등록 확인",
      "method": "채널에서 유료 서비스 판매 시 사업자등록번호 요구 → 국세청 홈택스 hometax.go.kr에서 조회",
      "priority": "medium"
    },
    {
      "item": "숨고/크몽 프로필 실제 확인",
      "method": "soomgo.com 또는 kmong.com에서 해당 강사 검색 → 리뷰 수, 평점, 판매 이력 확인",
      "priority": "medium"
    },
    {
      "item": "유사 채널 사기 피해 사례 검색",
      "method": "구글에서 채널명 + '사기' 또는 '환불' 검색, 한국소비자원 consumer.go.kr에서 업체 조회",
      "priority": "low"
    }
  ],
  "reportingGuide": {
    "primaryAgency": "한국소비자원",
    "phone": "1372",
    "website": "https://www.consumer.go.kr",
    "steps": [
      "1단계: 유료 서비스 관련 피해 발생 시 증거(결제 내역, 서비스 약속 내용) 저장",
      "2단계: 한국소비자원 1372 또는 consumer.go.kr에서 피해 구제 신청",
      "3단계: 명백한 사기로 판단되면 경찰청 사이버수사대 ecrm.cyber.go.kr에 신고"
    ]
  },
  "transcriptAnalysis": [
    {
      "quote": "누적 수익이 5천만원이 됐어요",
      "timestamp": "초반부",
      "issue": "고등학생 신분에서 누적 5천만원이라는 구체적 수치를 제시하지만, 통장 내역 등 객관적 증빙이 영상에서 확인되지 않습니다. 시청자에게 비현실적 기대감을 심어줄 수 있는 미검증 발언입니다.",
      "scamPattern": "성공팔이 (자기계발 강연)",
      "severity": "medium"
    },
    {
      "quote": "현재 다른 강사들도 관리하고 있어요",
      "timestamp": "후반부",
      "issue": "에이전시 운영을 주장하지만 사업자등록 여부나 실제 관리 규모를 확인할 수 없습니다. 과장된 전문성 주장은 향후 고가 코칭 판매의 신뢰도 장치로 활용될 수 있습니다.",
      "scamPattern": "고액 온라인 부업 강의",
      "severity": "low"
    }
  ],
  "analysisConfidence": "high",
  "confidenceReason": "자막이 제공되어 실제 발언 내용을 직접 분석할 수 있었고, 채널 설명과 제목 전략도 명확하게 파악되었습니다."
}

---

[예시 2 - YouTube 주식/투자 채널 / critical]
입력:
"""
[YouTube 영상 분석]
제목: 이번 주 무조건 오르는 종목 3개 공개 (선착순 VIP 입장 링크 아래)
채널명: 주식부자연구소

[채널 설명란]
전직 증권사 애널리스트 출신. 매주 급등 예정 종목 선공개. VIP 채널 월 39만원. 무료 체험 링크 ↓

[자막 없음 - 제목/채널명 기반으로만 분석]
"""

분석:
{
  "riskScore": 92,
  "riskLevel": "critical",
  "verdict": "극도 위험",
  "summary": "금융당국에 미등록된 불법 투자자문업을 운영하는 전형적인 주식 리딩방 채널입니다. '무조건 오르는 종목'이라는 제목은 자본시장법상 허위 과장 광고 금지 조항을 정면으로 위반하며, VIP 유료 채널로의 유도는 미등록 투자자문업 운영에 해당합니다. '전직 증권사 애널리스트 출신'이라는 채널 설명은 검증 불가능한 권위 주장으로, 실제 금융투자업 등록 없이 유료 종목 추천을 하면 5년 이하 징역에 처할 수 있습니다. 이 채널을 통해 투자 결정을 내리는 것은 매우 위험하며, 유료 채널 가입은 절대 해서는 안 됩니다.",
  "matchedScamTypes": [
    {
      "type": "주식 리딩방/유료 종목 추천",
      "similarity": "high",
      "reason": "급등 예정 종목 선공개, 월 39만원 VIP 채널, 무료 체험 후 유료 전환 구조가 주식 리딩방의 핵심 3요소를 모두 충족합니다. 특히 '무조건 오르는 종목'이라는 표현은 수익 보장 표현으로 자본시장법을 위반합니다."
    }
  ],
  "detectedSignals": [
    {
      "signal": "수익 보장성 표현",
      "evidence": "무조건 오르는 종목 3개 공개",
      "severity": "critical",
      "explanation": "주식 시장에서 '무조건 오르는 종목'은 존재하지 않으며, 이는 자본시장법상 허위 과장 광고에 해당합니다. 미등록 투자자문업자가 수익을 보장하는 것은 형사 처벌 대상입니다."
    },
    {
      "signal": "미공개 정보 이용 암시",
      "evidence": "급등 예정 종목 선공개",
      "severity": "critical",
      "explanation": "사전에 급등 여부를 알 수 있다는 것은 내부 정보 불법 이용이나 시세 조종 가담을 암시하며, 자본시장법 제174조 위반 혐의가 있습니다."
    },
    {
      "signal": "미등록 투자자문업 운영",
      "evidence": "VIP 채널 월 39만원",
      "severity": "critical",
      "explanation": "금융당국 등록 없이 유료로 투자 종목을 추천하는 것은 자본시장법 제17조 위반으로 5년 이하 징역 또는 2억원 이하 벌금에 해당합니다."
    },
    {
      "signal": "검증 불가능한 권위 주장",
      "evidence": "전직 증권사 애널리스트 출신",
      "severity": "high",
      "explanation": "'전직'이라는 표현은 현재 자격이 없음을 의미하며, 실제 경력도 검증할 수 없습니다. 합법적 투자자문사는 반드시 금융위원회 등록번호를 공개해야 합니다."
    },
    {
      "signal": "단계적 업셀링 구조",
      "evidence": "무료 체험 링크 ↓",
      "severity": "high",
      "explanation": "무료 체험으로 초기 신뢰를 구축한 후 월 39만원 유료 서비스로 전환하는 전형적인 업셀링 깔때기 구조입니다."
    },
    {
      "signal": "즉석 결정 강요",
      "evidence": "선착순 VIP 입장 링크",
      "severity": "high",
      "explanation": "선착순이라는 인위적 희소성으로 냉정한 판단을 방해하는 FOMO 전략입니다."
    }
  ],
  "safeAspects": [],
  "recommendation": "이 채널의 어떤 유료 서비스에도 가입하지 마세요. 금융감독원 금융소비자정보포털(fine.fss.or.kr)에서 '주식부자연구소'의 투자자문업 등록 여부를 먼저 확인하세요. 이미 가입하여 피해를 입었다면 입금 내역과 채팅 기록을 보관하고 즉시 금융감독원(1332)과 경찰청 사이버수사대(182)에 신고하세요.",
  "reportTo": ["금융감독원 1332", "경찰청 사이버수사대 182"],
  "legalAnalysis": {
    "violationRisk": "high",
    "applicableLaws": [
      "자본시장과 금융투자업에 관한 법률 제17조 (투자자문업 등록 의무): 금융당국 등록 없이 유료로 투자 종목을 추천하면 5년 이하 징역 또는 2억원 이하 벌금.",
      "자본시장법 제174조 (미공개중요정보 이용행위 금지): '급등 예정 종목 선공개'는 미공개정보 이용 거래 혐의 대상.",
      "표시·광고의 공정화에 관한 법률 제3조: '무조건 오르는 종목' 표현은 허위·과장 광고로 공정거래위원회 시정명령 대상."
    ],
    "explanation": "이 채널은 자본시장법의 다수 조항을 위반하고 있습니다. 특히 미등록 투자자문업 운영은 가장 명백한 위반이며, 실제 이 유형의 운영자들이 매년 금융감독원과 검찰의 수사를 받고 있습니다. 피해자도 금감원을 통해 민사 손해배상 청구가 가능합니다."
  },
  "psychologyTactics": [
    {
      "tactic": "FOMO (놓칠 것에 대한 두려움)",
      "description": "선착순 VIP 입장이라는 표현으로 '지금 당장 가입하지 않으면 수익 기회를 놓친다'는 심리적 압박을 가하여 냉정한 검토를 방해합니다.",
      "evidence": "선착순 VIP 입장 링크"
    },
    {
      "tactic": "권위 효과 (Authority Bias)",
      "description": "전직 증권사 애널리스트라는 검증 불가능한 전문가 타이틀로 신뢰를 구축하고, 비전문가인 시청자가 '전문가'의 말을 따르도록 심리적 의존감을 형성합니다.",
      "evidence": "전직 증권사 애널리스트 출신"
    },
    {
      "tactic": "내부자 정보 암시 (Insider Knowledge Illusion)",
      "description": "'선공개', '예정 종목' 등의 표현으로 일반 투자자는 알 수 없는 정보를 갖고 있다는 착각을 심어줘 독점적 이익에 대한 기대를 자극합니다.",
      "evidence": "급등 예정 종목 선공개, 무조건 오르는 종목"
    },
    {
      "tactic": "상호성 원리 (Reciprocity)",
      "description": "무료 체험을 먼저 제공하여 심리적 부채감을 형성하고, 이후 유료 전환을 거부하기 어렵게 만드는 기법입니다.",
      "evidence": "무료 체험 링크 ↓"
    }
  ],
  "verificationChecklist": [
    {
      "item": "투자자문업 등록 여부 (최우선 확인)",
      "method": "금융감독원 금융소비자정보포털 fine.fss.or.kr → '금융회사 조회' → '투자자문·일임업자' → 채널명/운영자명 검색",
      "priority": "high"
    },
    {
      "item": "금융위원회 제재·경고 이력 확인",
      "method": "금융위원회 공식 사이트 fsc.go.kr → '보도자료' → 불법금융 관련 공지 검색",
      "priority": "high"
    },
    {
      "item": "피해 사례 검색",
      "method": "네이버·구글에서 '주식부자연구소 사기', '주식부자연구소 환불' 검색 / 더치트 thecheat.co.kr에서 운영자 연락처 조회",
      "priority": "high"
    },
    {
      "item": "사업자등록 확인",
      "method": "사업자등록번호 요구 → 국세청 홈택스 hometax.go.kr에서 조회 (제공 거부 시 즉시 사기 의심)",
      "priority": "high"
    }
  ],
  "reportingGuide": {
    "primaryAgency": "금융감독원",
    "phone": "1332",
    "website": "https://www.fss.or.kr/fss/main/main.do",
    "steps": [
      "1단계 증거 수집: 채널 링크, VIP 채팅 내용, 종목 추천 화면, 입금 내역 스크린샷 저장 및 클라우드 백업",
      "2단계 금감원 신고: fss.or.kr → '불법금융신고센터' 또는 ☎1332 → 채널 URL 및 운영자 정보 제출",
      "3단계 수사 의뢰: 경찰청 사이버수사대 ecrm.cyber.go.kr 또는 ☎182 → 피해 금액과 증거 제출",
      "4단계 피해 회복: 금융감독원 분쟁조정위원회 또는 민사 소액심판 청구 (3,000만원 이하)"
    ]
  },
  "transcriptAnalysis": [],
  "analysisConfidence": "medium",
  "confidenceReason": "자막이 없어 실제 영상 내용을 분석하지 못했으나, 제목과 채널 설명만으로도 명백한 위험 패턴이 확인되어 중간 신뢰도로 판정합니다."
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
        ? `\n[블랙리스트 경고]\n채널 "${blacklistResult.entityName}"이 블랙리스트에 등록된 사기 사례입니다. (신고 ${blacklistResult.reportCount}건)\n`
        : "";

      const userMessage = [
        prescreen.promptContext,
        blacklistContext,
        transcript
          ? `\n다음 YouTube 콘텐츠를 분석해주세요:\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`
          : `\n다음 YouTube 콘텐츠를 분석해주세요 (자막 없음 — 제목/채널명 기반 분석, analysisConfidence를 반드시 medium 이하로 설정하세요):\n---분석 대상 시작---\n${analysisText}\n---분석 대상 끝---`,
      ]
        .filter(Boolean)
        .join("\n");

      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 8192,
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
      model: "gpt-4o",
      max_tokens: 4096,
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
