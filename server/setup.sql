-- ──────────────────────────────────────────────────────────────────────────
-- Lightinmotion — Supabase Setup SQL
-- Run this entire file in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Files metadata table
CREATE TABLE IF NOT EXISTS files (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  original_name  TEXT        NOT NULL,
  storage_path   TEXT        NOT NULL,
  device_type    TEXT        NOT NULL CHECK (device_type IN ('android','iphone','tv','desktop')),
  size           BIGINT      NOT NULL DEFAULT 0,
  size_formatted TEXT        NOT NULL DEFAULT '',
  downloads      INTEGER     NOT NULL DEFAULT 0,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index for ordering by date
CREATE INDEX IF NOT EXISTS files_uploaded_at_idx ON files (uploaded_at DESC);

-- 3. Enable Row Level Security (public reads, no writes without service key)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read files (public download page)
CREATE POLICY "Public read" ON files
  FOR SELECT USING (true);

-- Only service role can insert/update/delete (backend uses service key)
CREATE POLICY "Service write" ON files
  FOR ALL USING (auth.role() = 'service_role');
