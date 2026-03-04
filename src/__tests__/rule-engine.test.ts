import { normalizeText, matchBaitPhrases, matchWarningSignals, preScreenText } from "../lib/rule-engine";

describe("normalizeText", () => {
  test("인터펑트 점 제거", () => {
    expect(normalizeText("카·카·오·톡")).toBe("카카오톡");
  });

  test("공백+인터펑트 제거", () => {
    expect(normalizeText("제 · 휴 · 사")).toBe("제휴사");
  });

  test("전각 문자 정규화", () => {
    expect(normalizeText("Ａ１")).toBe("A1");
  });

  test("다중 공백 정리", () => {
    expect(normalizeText("원금   보장")).toBe("원금 보장");
  });

  test("일반 텍스트는 그대로", () => {
    expect(normalizeText("안녕하세요")).toBe("안녕하세요");
  });
});

describe("matchBaitPhrases", () => {
  test("미끼 문구 감지 — 원금보장", () => {
    const result = matchBaitPhrases("원금보장 투자 상품입니다");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.text.includes("원금보장") || p.text.includes("원금 보장"))).toBe(true);
  });

  test("미끼 문구 감지 — 월 1000만원", () => {
    const result = matchBaitPhrases("월 1000만원 수익 보장");
    expect(result.length).toBeGreaterThan(0);
  });

  test("정상 텍스트에서 미감지", () => {
    const result = matchBaitPhrases("안전한 금융상품 투자 정보입니다. 원금 손실 가능성이 있습니다.");
    expect(result.length).toBe(0);
  });

  test("대소문자 무관 감지", () => {
    const result = matchBaitPhrases("VIP 전용 종목 추천");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("matchWarningSignals", () => {
  test("즉석 결정 강요 감지 — 오늘만 할인", () => {
    const result = matchWarningSignals("오늘만 할인 이벤트 진행합니다");
    expect(result.some((s) => s.id === "instant-decision")).toBe(true);
  });

  test("수익 보장 신호 감지 — 원금 보장", () => {
    const result = matchWarningSignals("원금 보장 투자 상품입니다");
    expect(result.some((s) => s.id === "income-guarantee")).toBe(true);
  });

  test("정상 텍스트에서 미감지", () => {
    const result = matchWarningSignals("이 상품은 원금 손실이 발생할 수 있습니다. 투자에 유의하세요.");
    expect(result.length).toBe(0);
  });
});

describe("preScreenText", () => {
  test("고위험 텍스트는 shouldCallGPT=true", () => {
    const result = preScreenText("원금보장 월 500만원 수익! 오늘만 등록하면 VIP 특별 혜택");
    expect(result.shouldCallGPT).toBe(true);
    expect(result.riskScore).toBeGreaterThan(15);
  });

  test("안전 텍스트는 shouldCallGPT=false", () => {
    const result = preScreenText("안녕하세요. 오늘 날씨가 맑습니다.");
    expect(result.shouldCallGPT).toBe(false);
    expect(result.riskScore).toBeLessThanOrEqual(15);
  });

  test("우회 문자 사기 텍스트 감지", () => {
    const result = preScreenText("원·금·보·장 투자 상품");
    expect(result.shouldCallGPT).toBe(true);
  });

  test("promptContext 생성 확인", () => {
    const result = preScreenText("원금보장 수익보장");
    expect(result.promptContext).toContain("[1차 로컬 분석 결과]");
    expect(result.promptContext).toContain("1차 위험 점수");
  });

  test("riskScore 범위 0-100", () => {
    const high = preScreenText("원금보장 월 1000만원 오늘만 VIP 수익보장 다단계 출금차단");
    const safe = preScreenText("안녕하세요");
    expect(high.riskScore).toBeGreaterThanOrEqual(0);
    expect(high.riskScore).toBeLessThanOrEqual(100);
    expect(safe.riskScore).toBeGreaterThanOrEqual(0);
    expect(safe.riskScore).toBeLessThanOrEqual(100);
  });
});
