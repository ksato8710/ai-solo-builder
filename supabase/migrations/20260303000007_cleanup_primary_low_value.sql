-- ============================================================
-- Clean up low-value primary items to reduce data volume.
--
-- Strategy: keep primary items that are BOTH:
--   1. Published within the last 90 days
--   2. NVA score >= 55
-- Always keep items linked to published content (content_id IS NOT NULL).
--
-- Expected reduction: ~2,100 → ~110 items (95% reduction)
-- ============================================================

BEGIN;

DELETE FROM public.collected_items
WHERE source_tier = 'primary'
  AND content_id IS NULL
  AND (
    COALESCE(nva_total, 0) < 55
    OR published_at < NOW() - INTERVAL '90 days'
    OR published_at IS NULL
  );

COMMIT;
