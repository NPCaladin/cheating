export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">이용약관</h1>
      <p className="text-[#8b949e] text-sm mb-8">시행일: 2026년 3월 5일</p>

      <div className="prose-invert space-y-8 text-[#c9d1d9] text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 사기감별사(이하 &quot;서비스&quot;)가 제공하는 AI 기반 사기 판별 공익 서비스의 이용 조건 및
            절차에 관한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제2조 (서비스 개요)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI를 활용한 강연·교육·투자 관련 사기 의심 콘텐츠 분석</li>
            <li>15개 유형의 사기 패턴 데이터베이스 제공</li>
            <li>유튜브 영상 및 텍스트 기반 사기 판별</li>
            <li>피해 사례 제보 및 커뮤니티 기반 정보 공유</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제3조 (면책 조항)</h2>
          <div className="bg-[#f0a500]/5 border border-[#f0a500]/20 rounded-lg p-4">
            <p className="font-semibold text-[#f0a500] mb-2">중요 안내</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>본 서비스의 AI 분석 결과는 <strong>참고용</strong>이며, <strong>법적 효력이 없습니다.</strong></li>
              <li>분석 결과만으로 특정 개인이나 단체를 사기로 단정할 수 없습니다.</li>
              <li>실제 피해 발생 시 경찰청(182), 금융감독원(1332) 등 공식 기관에 신고하시기 바랍니다.</li>
              <li>서비스 이용으로 인한 직·간접적 손해에 대해 서비스 운영자는 책임을 지지 않습니다.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제4조 (이용자 의무)</h2>
          <p>이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>허위 또는 악의적인 제보를 통해 타인의 명예를 훼손하는 행위</li>
            <li>서비스를 이용하여 특정인을 비방·협박하는 행위</li>
            <li>서비스의 정상적 운영을 방해하는 행위</li>
            <li>자동화된 수단을 이용한 대량 분석 요청</li>
            <li>서비스 분석 결과를 사실처럼 유포하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제5조 (서비스 제한 및 중단)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스는 시스템 점검, 기술적 장애, 기타 운영상 필요에 의해 일시적으로 중단될 수 있습니다.</li>
            <li>이용자의 약관 위반 시 서비스 이용이 제한될 수 있습니다.</li>
            <li>서비스 운영자는 사전 고지 없이 서비스를 변경 또는 종료할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제6조 (지적재산권)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스의 UI, 분석 알고리즘, 사기 유형 데이터베이스 등은 서비스 운영자에게 귀속됩니다.</li>
            <li>이용자가 제보한 정보는 공익 목적으로 서비스 개선에 활용될 수 있습니다.</li>
            <li>분석 결과의 상업적 이용은 금지됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제7조 (책임 제한)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 운영자는 무료로 제공되는 본 서비스의 이용으로 발생하는 어떠한 손해에 대해서도 책임을 지지 않습니다.</li>
            <li>AI 분석의 정확성을 보증하지 않으며, 분석 결과에 따른 의사결정은 이용자 본인의 책임입니다.</li>
            <li>천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제8조 (준거법 및 관할)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>본 약관의 해석 및 적용에는 대한민국 법률이 적용됩니다.</li>
            <li>서비스 이용과 관련한 분쟁은 서울중앙지방법원을 관할 법원으로 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제9조 (약관 변경)</h2>
          <p>
            본 약관은 관련 법률 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해 공지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
