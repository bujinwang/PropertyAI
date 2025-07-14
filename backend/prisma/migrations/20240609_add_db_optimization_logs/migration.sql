-- Migration: Add db_optimization_logs table for optimization run summaries
-- Requires pgcrypto or uuid-ossp extension for UUID generation
CREATE TABLE db_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slow_queries_json JSONB,
  index_suggestions_json JSONB,
  metrics_json JSONB,
  alerts_json JSONB,
  log_type VARCHAR(32) NOT NULL DEFAULT 'scheduled',
  notes TEXT
); 