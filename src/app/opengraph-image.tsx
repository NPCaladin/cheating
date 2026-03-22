import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "사기감별사 — AI 위험 패턴 분석 서비스";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(240,165,0,0.15)",
            border: "1px solid rgba(240,165,0,0.3)",
            borderRadius: "999px",
            padding: "8px 20px",
            marginBottom: "32px",
          }}
        >
          <span style={{ color: "#f0a500", fontSize: "18px", fontWeight: 600 }}>
            무료 공익 서비스
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#e6edf3",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          사기감별사
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            color: "#f0a500",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          강연·교육·투자 AI 위험 패턴 분석
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "22px",
            color: "#8b949e",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          결제 전 꼭 확인하세요. 광고 문구를 붙여넣으면 즉시 분석합니다.
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
          }}
        >
          {[
            { value: "15개", label: "사기 유형" },
            { value: "50+", label: "위험 문구" },
            { value: "무료", label: "공익 서비스" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <span style={{ fontSize: "36px", fontWeight: 700, color: "#f0a500" }}>
                {stat.value}
              </span>
              <span style={{ fontSize: "18px", color: "#8b949e", marginTop: "4px" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
