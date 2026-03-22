/**
 * 언론 보도 기반 사기 데이터 DB — AI 프롬프트 주입용 요약
 *
 * 전체 데이터: data/fraud-statistics-korea.json, major-cases.json, new-scam-methods-2024-2026.json
 * 이 파일은 프롬프트 토큰 절약을 위해 핵심만 추출한 요약본입니다.
 */

import statisticsRaw from "../../data/fraud-statistics-korea.json";
import casesRaw from "../../data/major-cases.json";
import methodsRaw from "../../data/new-scam-methods-2024-2026.json";

/** 프롬프트에 주입할 피해 통계 요약 */
export function getStatsSummary(): string {
  return `## 한국 소비자 피해 통계 (언론 보도 기반, 2026-03 수집)

### 전체 규모
- 2024년 사기 범죄: 42만 9,949건 / 피해액 28조 1,353억원 (역대 최대, 전년 +22.9%)
- 전체 범죄 중 사기 비율: 26.6% (2024)

### 보이스피싱
- 2024년: 8,545억원 / 20,893건
- 2025년 1~10월: 1조 566억원 (사상 첫 1조 돌파, 전년비 +47%)
- 건당 평균: 5,290만원 (2021년 2,498만원 대비 2배+)
- 기관사칭형 78.6%, 피해자 52%가 20~30대

### 투자 리딩방
- 2년간(2023.9~2025.9): 14,629건 / 1조 2,901억원
- 건당 평균: 8,600만원 (보이스피싱의 2배)

### 중고거래 사기
- 2024년: 100,539건 / 3,340억원 (전년 대비 2배+)

### 로맨스 스캠
- 18개월간(2024.2~2025.7): 2,428건 / 1,380억원

### 다단계/유사수신
- 가상자산 다단계 5년 누적 5조원+
- 대표 사건: 휴스템코리아 3.3조원(20만명), 브이글로벌 2.2조원(5만명)`;
}

/** 프롬프트에 주입할 주요 사건 요약 */
export function getCasesSummary(): string {
  const cases = casesRaw.cases;
  const lines = cases.slice(0, 15).map((c: Record<string, string>) =>
    `- ${c.name} (${c.year}): 피해 ${c.damageAmount}${c.victimCount ? `, ${c.victimCount}` : ""}. ${c.result}`
  );

  return `## 주요 사건 (언론 보도 기반)
${lines.join("\n")}`;
}

/** 프롬프트에 주입할 신종 수법 요약 */
export function getMethodsSummary(): string {
  const methods = methodsRaw.methods;
  const lines = methods.map((m: Record<string, string>) =>
    `- **${m.name}** (${m.yearAppeared}): ${m.description.substring(0, 120)}...`
  );

  return `## 2024~2026 신종 수법 (언론 보도 기반)
${lines.join("\n")}`;
}

/** 전체 지식 DB를 프롬프트 컨텍스트로 변환 */
export function getKnowledgeContext(): string {
  return [
    getStatsSummary(),
    getCasesSummary(),
    getMethodsSummary(),
  ].join("\n\n");
}
