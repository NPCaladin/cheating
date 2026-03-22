export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-2">개인정보처리방침</h1>
      <p className="text-[#8b949e] text-sm mb-8">시행일: 2026년 3월 5일</p>

      <div className="prose-invert space-y-8 text-[#c9d1d9] text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">1. 개인정보의 수집 항목 및 수집 방법</h2>
          <p>사기감별사(이하 &quot;서비스&quot;)는 서비스 제공을 위해 아래의 개인정보를 수집합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>자동 수집 항목:</strong> IP 주소(해시 처리), 쿠키(광고·분석용), 접속 일시, 브라우저 및 기기 정보</li>
            <li><strong>이용자 입력 항목:</strong> 분석 요청 텍스트, URL(AI 위험 패턴 분석 목적)</li>
            <li><strong>제보 시:</strong> 사기 사례 관련 텍스트 정보(개인 식별 정보 수집하지 않음)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI 기반 위험 패턴 분석 서비스 제공</li>
            <li>사기 유형 데이터베이스 운영 및 개선</li>
            <li>서비스 이용 통계 분석 및 품질 개선</li>
            <li>광고 제공(Google AdSense)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>분석 로그:</strong> 수집일로부터 90일 후 자동 삭제</li>
            <li><strong>제보 데이터:</strong> 공익 목적 달성 시까지 보유(최대 3년)</li>
            <li><strong>쿠키:</strong> 브라우저 설정에 따라 관리</li>
          </ul>
          <p className="mt-2">이용자는 언제든지 개인정보 삭제를 요청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">4. 개인정보의 제3자 제공</h2>
          <p>서비스는 아래의 경우에 한해 개인정보를 제3자에게 제공합니다.</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border border-[#30363d]">
              <thead>
                <tr className="bg-[#161b22]">
                  <th className="border border-[#30363d] px-3 py-2 text-left">제공받는 자</th>
                  <th className="border border-[#30363d] px-3 py-2 text-left">목적</th>
                  <th className="border border-[#30363d] px-3 py-2 text-left">항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#30363d] px-3 py-2">Google (AdSense)</td>
                  <td className="border border-[#30363d] px-3 py-2">맞춤형 광고 제공</td>
                  <td className="border border-[#30363d] px-3 py-2">쿠키, 광고 식별자</td>
                </tr>
                <tr>
                  <td className="border border-[#30363d] px-3 py-2">Google (Gemini)</td>
                  <td className="border border-[#30363d] px-3 py-2">AI 위험 패턴 분석</td>
                  <td className="border border-[#30363d] px-3 py-2">분석 요청 텍스트</td>
                </tr>
                <tr>
                  <td className="border border-[#30363d] px-3 py-2">Vercel</td>
                  <td className="border border-[#30363d] px-3 py-2">웹 호스팅</td>
                  <td className="border border-[#30363d] px-3 py-2">서버 로그(IP 포함)</td>
                </tr>
                <tr>
                  <td className="border border-[#30363d] px-3 py-2">Supabase</td>
                  <td className="border border-[#30363d] px-3 py-2">데이터 저장</td>
                  <td className="border border-[#30363d] px-3 py-2">제보 데이터, 분석 로그</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">5. Google 광고 쿠키 및 맞춤 광고</h2>
          <p>
            본 서비스는 Google AdSense를 통해 광고를 게재하며, Google은 쿠키를 사용하여 이용자의 관심사에 기반한
            맞춤 광고를 제공할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Google은 DoubleClick 쿠키를 사용하여 이용자가 본 사이트 및 다른 웹사이트를 방문한 기록을 기반으로 광고를 게재합니다.</li>
            <li>이용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#f0a500] hover:underline">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</li>
            <li>또한 <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-[#f0a500] hover:underline">aboutads.info</a>에서 제3자 광고 쿠키를 관리할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정 및 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>쿠키 수집 거부(브라우저 설정 변경)</li>
          </ul>
          <p className="mt-2">
            권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하시면 지체 없이 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">7. 개인정보 보호책임자</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>담당:</strong> 사기감별사 운영팀</li>
            <li><strong>이메일:</strong> <a href="mailto:support@technoy.net" className="text-[#f0a500] hover:underline">support@technoy.net</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">8. 개인정보처리방침 변경</h2>
          <p>
            본 방침은 법률 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해 공지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
