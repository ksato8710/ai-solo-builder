-- ============================================================
-- Move all X (Twitter) account sources to tertiary tier
-- X accounts are social media, not official news sources.
-- ============================================================

BEGIN;

UPDATE public.sources
SET source_type = 'tertiary'
WHERE domain LIKE 'x.com/%'
  AND source_type IN ('primary', 'secondary')
  AND is_active = true;

COMMIT;
