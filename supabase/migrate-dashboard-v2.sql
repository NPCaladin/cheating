-- ============================================================
-- 대시보드 v2 마이그레이션
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. analysis_logs 칼럼 추가
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS input_preview TEXT;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS input_length INTEGER;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS ai_result JSONB;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS meta_channel TEXT;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS url_domain TEXT;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS detected_signals_count INTEGER DEFAULT 0;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE analysis_logs ADD COLUMN IF NOT EXISTS error BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_analysis_logs_type ON analysis_logs (type);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_error ON analysis_logs (error) WHERE error = TRUE;

-- 3. analysis_logs_archive 테이블
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

ALTER TABLE analysis_logs_archive ENABLE ROW LEVEL SECURITY;

-- 4. 90일 아카이브 RPC 함수
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
