-- 1. url_hash ごとに最新の collected_at の行だけ残し、残りを削除
DELETE FROM collected_items
WHERE id NOT IN (
  SELECT DISTINCT ON (url_hash) id
  FROM collected_items
  ORDER BY url_hash, collected_at DESC
);

-- 2. UNIQUE制約追加（今後の重複を防止）
CREATE UNIQUE INDEX IF NOT EXISTS uq_collected_items_url_hash
  ON collected_items (url_hash);
