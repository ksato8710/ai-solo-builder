-- Intelligence Loop: routing_targets カラム追加
-- collected_items にルーティング先の配列を格納する
-- 値: experiment, content_idea, process_knowledge, skill_knowledge
ALTER TABLE collected_items
  ADD COLUMN IF NOT EXISTS routing_targets text[] NOT NULL DEFAULT '{}';

-- ルーティング対象のアイテムを効率的に検索するためのインデックス
CREATE INDEX IF NOT EXISTS idx_collected_items_routing_targets
  ON collected_items USING GIN (routing_targets)
  WHERE array_length(routing_targets, 1) > 0;

-- routed_at: intelligence-router が処理した日時
ALTER TABLE collected_items
  ADD COLUMN IF NOT EXISTS routed_at timestamptz;
