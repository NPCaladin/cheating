-- ============================================================
-- 사기감별사 Supabase 스키마
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. analysis_logs — AI 판별 요청 기록
CREATE TABLE IF NOT EXISTS analysis_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type       TEXT NOT NULL CHECK (type IN ('text', 'youtube', 'sns')),
  risk_level TEXT,
  risk_score INTEGER,
  scam_type  TEXT,
  ai_called  BOOLEAN DEFAULT TRUE,
  ip_hash    TEXT
);

CREATE INDEX IF NOT EXISTS idx_analysis_logs_created_at ON analysis_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_risk_level ON analysis_logs (risk_level);

-- 2. reports — 사용자 피해 제보
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  scam_type     TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  damage        TEXT,
  platform      TEXT,
  operator_name TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'verified', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON reports (created_at DESC);

-- 3. blacklist — 신고된 사기 운영자/채널
CREATE TABLE IF NOT EXISTS blacklist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  entity_type  TEXT NOT NULL DEFAULT 'service',
  entity_name  TEXT NOT NULL UNIQUE,
  scam_type    TEXT,
  report_count INTEGER NOT NULL DEFAULT 1,
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  severity     TEXT NOT NULL DEFAULT 'medium'
               CHECK (severity IN ('low', 'medium', 'high')),
  notes        TEXT
);

-- 4. RPC: blacklist report_count 증가
CREATE OR REPLACE FUNCTION increment_report_count(p_entity_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blacklist SET report_count = report_count + 1
  WHERE entity_name = p_entity_name;
END;
$$ LANGUAGE plpgsql;

-- 5. Row Level Security (service role은 RLS 우회)
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist      ENABLE ROW LEVEL SECURITY;
-- 공개 접근 없음 (어드민 API는 service_role key 사용)
