export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">이용약관</h1>
      <p className="text-[#8b949e] text-sm mb-8">시행일: 2026년 3월 22일 (개정)</p>

      <div className="prose-invert space-y-8 text-[#c9d1d9] text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 사기감별사(이하 &quot;서비스&quot;)가 제공하는 AI 기반 소비자 피해 예방 패턴 분석 서비스의 이용 조건 및
            절차에 관한 사항을 규정함을 목적으로 합니다. 서비스 이용 시 본 약관에 동의한 것으로 간주합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제2조 (서비스 개요)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI를 활용한 텍스트 패턴 분석 (소비자 피해 예방 목적)</li>
            <li>15개 유형의 위험 패턴 데이터베이스 제공</li>
            <li>유튜브 영상 및 텍스트 기반 위험 패턴 탐지</li>
            <li>피해 사례 제보 및 정보 공유</li>
          </ul>
          <p className="mt-2">
            본 서비스는 입력된 텍스트에서 알려진 위험 패턴을 탐지하는 도구이며, 특정 개인·단체·채널의 적법성을 판단하거나
            사기 여부를 확정하는 서비스가 아닙니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제3조 (면책 조항)</h2>
          <div className="bg-[#f0a500]/5 border border-[#f0a500]/20 rounded-lg p-4">
            <p className="font-semibold text-[#f0a500] mb-2">중요 안내</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>본 서비스의 AI 분석 결과는 입력된 텍스트의 <strong>패턴 매칭 결과</strong>이며, 특정 개인·단체·채널에 대한 <strong>사실 판단이 아닙니다.</strong></li>
              <li>분석 결과는 <strong>참고 정보</strong>로서 <strong>법적 효력이 없으며</strong>, 사기 여부를 확정하지 않습니다.</li>
              <li>AI는 오판(false positive/negative)할 수 있으며, 분석 결과의 정확성을 보증하지 않습니다.</li>
              <li>분석 결과에 따른 의사결정 및 그로 인한 결과는 전적으로 이용자 본인의 책임입니다.</li>
              <li>실제 피해가 의심되는 경우 반드시 경찰청(182), 금융감독원(1332) 등 공식 수사·감독 기관에 확인하시기 바랍니다.</li>
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
            <li><strong>분석 결과를 사실로 단정하여 유포하는 행위</strong> (예: &quot;AI가 사기라고 판정했다&quot;는 식의 게시)</li>
            <li><strong>분석 결과의 캡처·인용을 통해 특정 개인·채널·단체를 비방하는 행위</strong></li>
            <li>분석 결과를 근거로 제3자에게 경제적·사회적 불이익을 주는 행위</li>
          </ul>
          <p className="mt-2">
            위 의무를 위반하여 발생하는 제3자와의 분쟁에 대해 서비스 운영자는 일체의 책임을 지지 않으며,
            이용자가 단독으로 책임을 부담합니다.
          </p>
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
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제8조 (분석 결과에 대한 이의 제기)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>분석 대상 콘텐츠의 제작자·운영자 본인은 분석 결과가 부당하다고 판단할 경우 이의를 제기할 수 있습니다.</li>
            <li>이의 제기는 서비스 내 &quot;피해 제보&quot; 페이지 또는 이메일(zorbais2@gmail.com)을 통해 접수합니다.</li>
            <li>이의 제기 시 본인 확인 자료(채널 소유 증빙 등)와 이의 사유를 함께 제출해야 합니다.</li>
            <li>운영자는 이의 제기 접수 후 14영업일 이내에 검토 결과를 통보하며, 부당하다고 인정되는 경우 해당 분석 기록을 삭제하거나 시정 조치합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제9조 (준거법 및 관할)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>본 약관의 해석 및 적용에는 대한민국 법률이 적용됩니다.</li>
            <li>서비스 이용과 관련한 분쟁은 서울중앙지방법원을 관할 법원으로 합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">제10조 (약관 변경)</h2>
          <p>
            본 약관은 관련 법률 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해 공지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
