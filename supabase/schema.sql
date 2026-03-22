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
  ip_hash    TEXT,
  -- 확장 칼럼 (2026-03-22)
  input_preview TEXT,                          -- 입력 앞 200자 (민감정보 마스킹)
  input_length INTEGER,                        -- 입력 전체 길이
  ai_result JSONB,                             -- AI 분석 결과 전체
  meta_title TEXT,                             -- YouTube 제목
  meta_channel TEXT,                           -- YouTube 채널명
  url_domain TEXT,                             -- 분석 URL 도메인
  detected_signals_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,                    -- AI 응답 시간
  error BOOLEAN DEFAULT FALSE                  -- 에러 여부
);

CREATE INDEX IF NOT EXISTS idx_analysis_logs_created_at ON analysis_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_risk_level ON analysis_logs (risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_type ON analysis_logs (type);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_error ON analysis_logs (error) WHERE error = TRUE;

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

-- 5. analysis_logs_archive — 90일 경과 로그 백업
CREATE TABLE IF NOT EXISTS analysis_logs_archive (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT,
  risk_level TEXT,
  risk_score INTEGER,
  scam_type TEXT,
  ai_called BOOLEAN,
  ip_hash TEXT,
  input_preview TEXT,
  input_length INTEGER,
  ai_result JSONB,
  meta_title TEXT,
  meta_channel TEXT,
  url_domain TEXT,
  detected_signals_count INTEGER,
  response_time_ms INTEGER,
  error BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_archive_created_at ON analysis_logs_archive (created_at DESC);

-- 6. 90일 아카이브 RPC 함수
CREATE OR REPLACE FUNCTION archive_old_logs()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM analysis_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING *
  )
  INSERT INTO analysis_logs_archive
    SELECT id, created_at, NOW(), type, risk_level, risk_score, scam_type,
           ai_called, ip_hash, input_preview, input_length, ai_result,
           meta_title, meta_channel, url_domain, detected_signals_count,
           response_time_ms, error
    FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Row Level Security (service role은 RLS 우회)
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_logs_archive ENABLE ROW LEVEL SECURITY;
-- 공개 접근 없음 (어드민 API는 service_role key 사용)
