"use client";

import { useState } from "react";
import { TrendingUp, BookOpen, Zap, Users, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Search } from "lucide-react";

const categories = [
  {
    id: "investment",
    name: "투자/재테크 사기",
    icon: TrendingUp,
    color: "text-red-400",
    bg: "bg-red-400/5",
    border: "border-red-400/20",
    headerBg: "bg-red-400/10",
    types: [
      {
        id: "stock-leading",
        name: "주식 리딩방/유료 종목 추천",
        severity: "high",
        damage: "2년간 1.3조원",
        victims: "14,255명+",
        description: "유료 회원제 단체 채팅방에서 허위 종목 추천 및 선행매매로 투자자를 속이는 사기. 운영자가 먼저 종목을 매수한 후 회원들에게 추천해 주가를 띄우고 자신은 고점에 매도.",
        baitPhrases: ["VIP 회원 전용 종목", "곧 급등할 종목 선공개", "슈퍼개미 픽", "수익률 300% 달성"],
        warningSignals: ["수익 보장 약속", "즉석 결정 강요", "VIP 업그레이드 유도", "조작된 수익 인증샷"],
        howToVerify: ["금융감독원에서 투자자문업 등록 여부 확인", "운영자 실명 및 자격증 확인", "수익 인증샷 진위 확인"],
        reportTo: ["금융감독원 1332", "경찰청 사이버수사대 182"],
        cases: ["슈퍼개미 유튜버 58억원 선행매매", "생존재테크 유튜버 1.3억원 편취"],
      },
      {
        id: "coin-leading",
        name: "코인/가상화폐 리딩방",
        severity: "high",
        damage: "최근 5년 약 7조원",
        victims: "15,304명+(단일 사건)",
        description: "가상화폐 투자 수익을 미끼로 유료 채팅방을 운영하거나 폰지사기를 벌임. 가짜 거래소 앱을 설치시켜 조작된 수익을 보여준 후 대규모 입금을 유도하고 잠적.",
        baitPhrases: ["코인 급등 직전 정보", "AI로 코인 자동매매", "스테이킹 연 600% 수익", "상장 직전 코인 선점"],
        warningSignals: ["비현실적 수익률(연 100%+)", "출금 제한 또는 추가 입금 요구", "가짜 거래소 앱 설치 유도"],
        howToVerify: ["금융정보분석원(KoFIU) 가상자산사업자 등록 확인", "앱스토어/플레이스토어 정식 등록 확인"],
        reportTo: ["금융감독원 1332", "경찰청 사이버수사대 182"],
        cases: ["62만 유튜버 총책 3,256억원 코인 사기(15,304명 피해)"],
      },
      {
        id: "fx-leading",
        name: "FX마진/해외선물 리딩방",
        severity: "high",
        damage: "건당 100~1,400억원",
        victims: "수천 명",
        description: "외환거래 및 해외선물 고수익을 빙자해 투자금을 모집하는 폰지사기. 가짜 HTS(홈트레이딩시스템) 앱으로 수익을 조작해 보여주고, 출금 요청 시 추가 세금·수수료를 요구.",
        baitPhrases: ["해외선물 월 500만원 수익", "FX마진 자동매매 시스템", "레버리지로 소액 대박"],
        warningSignals: ["가짜 HTS 플랫폼 설치 유도", "수익 후 갑자기 출금 거부", "추가 세금/수수료 입금 요구"],
        howToVerify: ["금융감독원 외환거래 허가 업체 목록 확인", "공식 금융기관 앱인지 구글/애플 스토어 확인"],
        reportTo: ["금융감독원 1332", "경찰청 사이버수사대 182"],
        cases: ["FX마진 폰지사기 1,400억원(2,400명)", "가짜 HTS 앱 사기 207억원"],
      },
      {
        id: "ai-trading",
        name: "AI 자동매매 투자 사기",
        severity: "medium",
        damage: "117억원+",
        victims: "3,300명+",
        description: "AI 기술을 빙자한 자동매매 프로그램 판매 또는 투자금 모집 사기. 'AI가 알아서 수익 창출'이라며 프로그램 구매비와 투자금을 함께 편취하는 방식이 많음.",
        baitPhrases: ["AI가 알아서 수익 창출", "24시간 자동매매", "AI 승률 95%", "ChatGPT 연동 투자 시스템"],
        warningSignals: ["AI 알고리즘 내용 비공개", "프로그램 구매비+투자금 동시 요구", "다단계 모집 구조"],
        howToVerify: ["알고리즘 설명 및 제3자 검증 요청", "금융위원회 혁신금융서비스 지정 여부 확인"],
        reportTo: ["금융감독원 1332", "공정거래위원회", "경찰청"],
        cases: ["AI 자동매매 프로그램 사기 117억원(300명)", "AI 신사업 다단계(3,000명+)"],
      },
    ],
  },
  {
    id: "education",
    name: "강연/교육/코칭 사기",
    icon: BookOpen,
    color: "text-amber-400",
    bg: "bg-amber-400/5",
    border: "border-amber-400/20",
    headerBg: "bg-amber-400/10",
    types: [
      {
        id: "success-selling",
        name: "성공팔이 (자기계발 강연)",
        severity: "medium",
        damage: "집단소송 진행 중",
        victims: "수천 명",
        description: "과장된 성공 스토리와 자기계발 콘텐츠로 무료→저가→고가 코칭으로 업셀링하는 사기. 검증 불가한 성공 경험을 내세워 수백~수천만원의 마스터마인드, VIP 코칭을 판매.",
        baitPhrases: ["월 1억 자동수익 시스템", "나도 처음엔 평범했다", "경제적 자유를 얻는 방법", "인생을 바꿀 단 하나의 강의"],
        warningSignals: ["검증 불가한 성공 스토리", "단계적 업셀링", "부정 댓글 삭제", "환불 규정 불명확"],
        howToVerify: ["강사 실제 사업 성과 검증(사업자등록증)", "네이버에서 '강사명+사기' 검색", "소비자원 피해 사례 조회"],
        reportTo: ["한국소비자원 1372", "공정거래위원회"],
        cases: ["자청(역행자) 집단소송", "로알남 워드프레스 강의 피해", "MKYU 교육 플랫폼 피해"],
      },
      {
        id: "online-side-job",
        name: "고액 온라인 부업 강의",
        severity: "high",
        damage: "건당 100~500만원",
        victims: "2025년 42건+ (4배 급증)",
        description: "SNS 마케팅, 유튜브 수익화, 브랜드 홍보 등 온라인 부업 강의로 수백만원을 편취. 수강 후 실제 수익은 거의 없고, 추가 툴·서비스 구매를 강요하는 방식도 빈번.",
        baitPhrases: ["강의만 들으면 월 300 가능", "누구나 할 수 있는 부업", "수강생 90% 수익 달성"],
        warningSignals: ["구체적 성과 약속 없음", "수강 후 추가 구매 강요", "검증 불가한 수강생 후기"],
        howToVerify: ["소비자원에서 동일 업체 피해 사례 확인", "강사 실제 부업 수익 증빙 요구", "수강 전 계약서 작성"],
        reportTo: ["한국소비자원 1372", "공정거래위원회"],
        cases: ["브랜드 홍보 부업 강의(건당 100~400만원)", "유튜브 수익화 강의(건당 200~500만원)"],
      },
      {
        id: "coding-bootcamp",
        name: "코딩/부트캠프 교육 사기",
        severity: "medium",
        damage: "구조적 문제",
        victims: "수천 명",
        description: "국비지원 수업을 과장하고 취업률을 조작해 수강생을 모집하는 사기. '6개월이면 개발자'라는 허위 광고로 청년들을 유혹하고, 수료 후 취업 지원이 전무한 경우가 많음.",
        baitPhrases: ["6개월이면 개발자 취업", "취업 성공률 95%", "국비지원으로 무료 수강"],
        warningSignals: ["취업률 산정 기준 불명확", "수료 후 취업 연계 부재", "실제 커리큘럼이 광고와 다름"],
        howToVerify: ["HRD-Net에서 국비지원 과정 등록 확인", "수료생 후기를 블라인드/잡플래닛에서 확인"],
        reportTo: ["고용노동부", "한국소비자원 1372"],
        cases: ["국비지원 취업률 조작 부트캠프 다수"],
      },
      {
        id: "private-certificate",
        name: "민간자격증 사기",
        severity: "medium",
        damage: "상담 건수 95% 급증",
        victims: "수천 명",
        description: "취업·수익 보장을 내세운 허위 민간자격증 발급. 'AI 자격증으로 월 1,000만원', 'ESG 자격증 필수' 등으로 유혹하지만, 실제로는 공신력 없는 민간 자격증에 불과.",
        baitPhrases: ["국가공인 준비 중인 자격증", "이 자격증 하나로 월 1,000만원", "수료만 하면 바로 취업"],
        warningSignals: ["발급 기관 공신력 불분명", "'국가공인' 오해 유발 표현", "자격증 갱신비 지속 청구"],
        howToVerify: ["Q-NET(한국산업인력공단)에서 국가자격증 여부 확인", "민간자격 정보 서비스(pqi.or.kr) 등록 확인"],
        reportTo: ["교육부", "한국소비자원 1372"],
        cases: ["AI 자격증 '월 1,000만원' 광고", "ESG 자격증 난립(192개+)"],
      },
      {
        id: "reward-platform",
        name: "보상형 플랫폼 먹튀",
        severity: "high",
        damage: "수억원+",
        victims: "2,500명+",
        description: "미션 수행 후 현금 보상을 약속하다가 갑자기 서비스를 종료하고 잠적하는 플랫폼 사기. 초기에는 정상적으로 소액을 지급해 신뢰를 쌓은 후 더 큰 금액을 받고 사라짐.",
        baitPhrases: ["공부하면서 돈 버는 앱", "미션 달성 시 현금 지급", "매일 30분으로 월 50만원"],
        warningSignals: ["초기 소액 지급 후 대규모 모집", "현금 인출 조건 점점 어려워짐", "회사 정보 불투명"],
        howToVerify: ["사업자등록번호로 국세청 조회", "커뮤니티에서 실제 수령 후기 확인", "약관의 적립금 소멸 조건 확인"],
        reportTo: ["한국소비자원 1372", "경찰청 사이버수사대 182"],
        cases: ["미션캠프 파산(500명/3억원+)", "파트타임스터디 먹튀(2,000명+)"],
      },
    ],
  },
  {
    id: "side-business",
    name: "부업/커머스 사기",
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-400/5",
    border: "border-blue-400/20",
    headerBg: "bg-blue-400/10",
    types: [
      {
        id: "team-mission",
        name: "팀미션/SNS 부업 사기",
        severity: "high",
        damage: "건당 최대 3.2억원",
        victims: "수만 명",
        description: "SNS 좋아요·앱 설치 등 단순 미션 후 현금 보상을 약속하는 사기. 텔레그램으로 접근해 초기엔 정상 지급 후 점점 큰 '보증금'을 요구하며 사라짐. '10초에 5천원' 수준의 광고는 100% 사기.",
        baitPhrases: ["10초에 5천원", "좋아요만 눌러도 돈 버는 앱", "선입금 후 보상 지급"],
        warningSignals: ["미션 전 보증금 선입금 요구", "텔레그램/위챗 등 추적 어려운 채널", "조기 실제 지급 후 대금 유도"],
        howToVerify: ["어떤 합법적 회사도 SNS 좋아요에 5천원을 지급하지 않음", "선입금 요구 즉시 사기로 의심"],
        reportTo: ["경찰청 사이버수사대 182", "금융감독원 1332"],
        cases: ["텔레그램 팀미션 건당 최대 3.2억원", "'10초에 5천원' 사기 다수"],
      },
      {
        id: "smart-store",
        name: "스마트스토어/쇼핑몰 사기",
        severity: "medium",
        damage: "전국 수천 명",
        victims: "수천 명",
        description: "스마트스토어 대리 운영, 유령 팔로워 판매 등 전자상거래 관련 사기. 운영비 선납 후 실적 부진을 핑계로 잠적하거나, 가짜 팔로워·리뷰로 인한 플랫폼 제재 피해를 입힘.",
        baitPhrases: ["스마트스토어 대신 운영해 드립니다", "월 300 버는 스마트스토어 비법", "팔로워 1만명 만들기 강의"],
        warningSignals: ["운영비 선납 후 실적 부진 시 잠적", "가짜 팔로워/리뷰 서비스", "계약서 없는 구두 약속"],
        howToVerify: ["사업자등록증 및 통신판매업 신고 확인", "계약 전 서면 계약서 작성"],
        reportTo: ["한국소비자원 1372", "경찰청"],
        cases: ["스마트스토어 대리 마케팅 사기 다수"],
      },
      {
        id: "overseas-purchase",
        name: "해외구매대행/아마존 셀러 사기",
        severity: "medium",
        damage: "3.1억원+",
        victims: "수백 명",
        description: "아마존 셀러 교육 및 해외구매대행 서비스를 빙자한 사기. 아마존 공식 파트너를 사칭하거나, 초기 상품 구매비·재고 선납 요구 후 사라지는 방식이 많음.",
        baitPhrases: ["아마존 FBA로 월 1,000만원", "미국 시장 진출 쉽게", "아마존 우수 판매자 노하우"],
        warningSignals: ["아마존 공식 파트너 허위 주장", "초기 상품 구매비 또는 재고 선납", "수익 미발생 시 환불 없음"],
        howToVerify: ["아마존 공식 파트너 홈페이지에서 확인", "계약 전 실제 판매 계정 스크린샷 요청"],
        reportTo: ["한국소비자원 1372", "경찰청"],
        cases: ["아마존 사칭 사이트 3.1억원(12명)"],
      },
    ],
  },
  {
    id: "real-estate-multi",
    name: "부동산/다단계/기타",
    icon: Users,
    color: "text-purple-400",
    bg: "bg-purple-400/5",
    border: "border-purple-400/20",
    headerBg: "bg-purple-400/10",
    types: [
      {
        id: "real-estate-lecture",
        name: "부동산 강연/기획부동산 사기",
        severity: "high",
        damage: "수십억~조 단위",
        victims: "수만 명",
        description: "허위 부동산 전문가 행세 또는 확정되지 않은 개발 호재를 과장해 투자금을 편취. 기획부동산은 맹지·임야를 시세보다 수십 배 높은 가격에 판매하는 방식이 대표적.",
        baitPhrases: ["소액으로 시작하는 갭투자", "개발 호재 확정 지역 선점", "전문가만 아는 부동산 비법"],
        warningSignals: ["공개되지 않은 '내부 정보' 주장", "계약금 빠른 납부 강요", "정식 부동산 중개업 등록 없음"],
        howToVerify: ["공인중개사 자격증 국토교통부에서 확인", "등기부등본 직접 열람", "도시계획 확인원 조회"],
        reportTo: ["한국소비자원 1372", "국토교통부", "경찰청"],
        cases: ["가짜 부동산 전문가 22억원", "전세사기 2.4조원"],
      },
      {
        id: "multi-level",
        name: "다단계/네트워크마케팅",
        severity: "high",
        damage: "3.3조원+",
        victims: "20만 명+",
        description: "교육비·제품 구매를 명목으로 한 불법 피라미드 사기. 수익이 신규 회원 모집에 의존하는 구조. '사람만 데려오면 추가 수익'이라는 말이 핵심 신호.",
        baitPhrases: ["사람만 데려오면 추가 수익", "네트워크 비즈니스 기회", "5명만 모으면 월 500만원"],
        warningSignals: ["지인 모집 압박", "고가 제품/서비스 의무 구매", "수익이 신규 모집에 의존"],
        howToVerify: ["공정거래위원회 다단계판매업체 등록 확인", "후원수당 비율 법적 기준(35%) 이내 확인"],
        reportTo: ["공정거래위원회", "한국소비자원 1372", "경찰청"],
        cases: ["휴스템코리아 3.3조원(20만명)", "교육비 명목 다단계 다수"],
      },
      {
        id: "gambling",
        name: "로또/도박/스포츠토토 사기",
        severity: "high",
        damage: "사설토토 시장 37~45조원",
        victims: "9,000명+(로또 예측 단일)",
        description: "로또 예측, 스포츠 분석을 빙자한 픽스터 사기 및 불법 도박 사이트 유도. '적중률 95%', 'AI 예측'으로 유혹하지만 로또는 무작위 추첨으로 예측이 원천적으로 불가능.",
        baitPhrases: ["AI 로또 번호 예측 적중률 95%", "스포츠토토 전액 환불 보장", "이번 주 당첨 번호 공유"],
        warningSignals: ["유료 예측 번호 판매", "불법 사설 사이트로 유도", "당첨 시 수수료 선납 요구"],
        howToVerify: ["로또 번호는 무작위로 예측 원천 불가", "SIWI 합법 사이트 목록 확인"],
        reportTo: ["경찰청 사이버수사대 182", "사행산업통합감독위원회"],
        cases: ["로또 예측 128억원(9,000명)", "사설 스포츠토토 피해 다수"],
      },
    ],
  },
];

const severityLabel = {
  high: { text: "높은 위험", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  medium: { text: "주의", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  low: { text: "낮은 위험", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
};

function ScamTypeCard({ type, categoryColor }: { type: typeof categories[0]["types"][0]; categoryColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityLabel[type.severity as keyof typeof severityLabel];

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-start gap-3 hover:bg-[#21262d]/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sev.color}`}>
              {sev.text}
            </span>
            <span className="text-[#8b949e] text-xs">피해: {type.damage}</span>
          </div>
          <h3 className="font-semibold text-[#e6edf3] text-sm">{type.name}</h3>
          {!expanded && (
            <p className="text-[#8b949e] text-xs mt-1 line-clamp-2">{type.description}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#8b949e] shrink-0 mt-1" /> : <ChevronDown size={16} className="text-[#8b949e] shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#21262d]">
          <p className="text-[#8b949e] text-sm leading-relaxed pt-4">{type.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bait phrases */}
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">주요 미끼 문구</h4>
              <div className="flex flex-wrap gap-1.5">
                {type.baitPhrases.map((phrase) => (
                  <span key={phrase} className="px-2 py-1 rounded-lg bg-red-400/5 border border-red-400/20 text-red-300 text-xs">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>

            {/* Warning signals */}
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">위험 신호</h4>
              <ul className="space-y-1">
                {type.warningSignals.map((signal) => (
                  <li key={signal} className="flex items-start gap-2 text-xs text-[#8b949e]">
                    <AlertTriangle size={10} className="text-amber-400 shrink-0 mt-0.5" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            {/* How to verify */}
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">진위 확인 방법</h4>
              <ul className="space-y-1">
                {type.howToVerify.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-[#8b949e]">
                    <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Representative cases */}
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">대표 사례</h4>
              <ul className="space-y-1">
                {type.cases.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs text-[#8b949e]">
                    <span className={`${categoryColor} shrink-0 mt-0.5`}>•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Report to */}
          <div>
            <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">신고 기관</h4>
            <div className="flex flex-wrap gap-2">
              {type.reportTo.map((org) => (
                <span key={org} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#8b949e] text-xs">
                  <ExternalLink size={10} />
                  {org}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TypesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = categories.map((cat) => ({
    ...cat,
    types: cat.types.filter(
      (t) =>
        t.name.includes(search) ||
        t.description.includes(search) ||
        t.baitPhrases.some((p) => p.includes(search))
    ),
  })).filter((cat) => cat.types.length > 0);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3] mb-2">
            사기 유형 백과
          </h1>
          <p className="text-[#8b949e] text-sm">
            15개 사기 유형을 카테고리별로 정리했습니다. 미끼 문구, 위험 신호, 신고 기관을 확인하세요.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="사기 유형, 미끼 문구 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30"
                : "bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3]"
            }`}
          >
            전체 ({categories.reduce((s, c) => s + c.types.length, 0)})
          </button>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? `${cat.bg} ${cat.color} border ${cat.border}`
                    : "bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3]"
                }`}
              >
                <Icon size={12} />
                {cat.name.split("/")[0]}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filtered
            .filter((cat) => !activeCategory || cat.id === activeCategory)
            .map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} id={cat.id}>
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${cat.headerBg} border ${cat.border} mb-4`}>
                    <Icon size={18} className={cat.color} />
                    <div>
                      <h2 className={`font-semibold ${cat.color} text-sm`}>{cat.name}</h2>
                      <p className="text-[#8b949e] text-xs">{cat.types.length}개 유형</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {cat.types.map((type) => (
                      <ScamTypeCard key={type.id} type={type} categoryColor={cat.color} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#8b949e]">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
