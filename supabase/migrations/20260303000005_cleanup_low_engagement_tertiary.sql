-- ============================================================
-- Clean up low-engagement tertiary items to reduce data volume.
-- Tertiary (community) items with engagement_likes + replies < 5
-- are noise that inflates storage and query costs.
-- Also removes items older than 60 days with low NVA scores.
-- ============================================================

BEGIN;

-- 1. Delete tertiary items with insufficient engagement signal
DELETE FROM public.collected_items
WHERE source_tier = 'tertiary'
  AND (COALESCE(engagement_likes, 0) + COALESCE(engagement_replies, 0)) < 5;

-- 2. Delete old items (> 60 days) with low NVA that weren't promoted to content
DELETE FROM public.collected_items
WHERE collected_at < NOW() - INTERVAL '60 days'
  AND COALESCE(nva_total, 0) < 55
  AND content_id IS NULL;

COMMIT;
