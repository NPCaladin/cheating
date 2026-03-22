import { ShieldAlert, Brain, Database, Search, Mail } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI 위험 패턴 분석 엔진",
    desc: "AI가 텍스트와 영상에서 알려진 위험 패턴을 탐지하여 참고 정보를 제공합니다.",
  },
  {
    icon: Database,
    title: "15개 유형 위험 패턴 DB",
    desc: "투자, 교육, 다단계, 코인 등 15개 카테고리의 위험 패턴 데이터베이스를 운영합니다.",
  },
  {
    icon: Search,
    title: "룰 기반 1차 필터",
    desc: "302개 이상의 위험 문구와 17개 위험 신호를 기반으로 1차 사전 검토합니다.",
  },
  {
    icon: ShieldAlert,
    title: "이용자 제보 이력 조회",
    desc: "이용자들의 제보 이력과 대조하여 참고 정보를 제공합니다.",
  },
];

const dataSources = [
  "자체 구축 위험 패턴 DB (302개 위험 문구, 17개 위험 신호)",
  "언론 보도 기반 피해 사례·통계 DB (수동 수집·검증)",
  "이용자 제보 데이터 (커뮤니티 기반)",
  "공공 보도자료 및 통계 참고 (경찰청, 금감원, 소비자원 등)",
  "AI(Gemini) 사전 학습 지식 기반 패턴 분석",
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">서비스 소개</h1>
      <p className="text-[#8b949e] text-sm mb-10">
        사기감별사는 강연·교육·투자 관련 소비자 피해를 예방하는 AI 기반 위험 패턴 분석 서비스입니다.
      </p>

      {/* Mission */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">미션</h2>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
          <p className="text-[#c9d1d9] text-sm leading-relaxed">
            매년 수조 원에 달하는 소비자 피해가 발생하고 있지만, 개인이 위험 요소를 파악하기는 쉽지 않습니다.
            사기감별사는 AI 기술과 공공 데이터를 활용하여 <strong className="text-[#f0a500]">누구나 무료로</strong> 의심스러운
            강연, 교육, 투자 제안의 위험 패턴을 확인할 수 있는 도구를 제공합니다.
          </p>
          <p className="text-[#c9d1d9] text-sm leading-relaxed mt-3">
            &quot;한 건의 사기라도 미리 막을 수 있다면&quot; — 이것이 사기감별사가 존재하는 이유입니다.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#e6edf3] mb-4">작동 원리</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <f.icon size={16} className="text-[#f0a500]" />
                <h3 className="text-sm font-semibold text-[#e6edf3]">{f.title}</h3>
              </div>
              <p className="text-[#8b949e] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">데이터 출처</h2>
        <ul className="space-y-2">
          {dataSources.map((source) => (
            <li key={source} className="flex items-center gap-2 text-[#c9d1d9] text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0a500] flex-shrink-0" />
              {source}
            </li>
          ))}
        </ul>
      </section>

      {/* Operator info */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">운영 정보</h2>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 text-sm text-[#c9d1d9] space-y-2">
          <p><strong className="text-[#e6edf3]">운영:</strong> 바이브로직스(VibeLogics)</p>
          <p><strong className="text-[#e6edf3]">서비스 성격:</strong> 비영리 공익 프로젝트</p>
          <p><strong className="text-[#e6edf3]">운영 비용:</strong> 광고 수익으로 서버 및 AI API 비용 충당</p>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">문의</h2>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm text-[#c9d1d9]">
            <Mail size={16} className="text-[#f0a500]" />
            <a href="mailto:support@technoy.net" className="text-[#f0a500] hover:underline">
              support@technoy.net
            </a>
          </div>
          <p className="text-[#8b949e] text-xs mt-2">
            서비스 관련 문의, 오류 신고, 삭제 요청 등을 보내주세요. 영업일 기준 3일 이내 답변드립니다.
          </p>
        </div>
      </section>
    </main>
  );
}
