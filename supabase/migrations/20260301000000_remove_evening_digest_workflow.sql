-- Remove evening digest workflow (夕刊キュレーション) and its source mappings
-- Evening digest has been discontinued; only morning digest remains.

DO $$
DECLARE
  evening_id uuid;
BEGIN
  -- Find the evening digest workflow id
  SELECT id INTO evening_id
  FROM content_workflows
  WHERE workflow_code = 'digest-evening-curation';

  IF evening_id IS NOT NULL THEN
    DELETE FROM workflow_source_mappings WHERE workflow_id = evening_id;
    DELETE FROM content_workflows WHERE id = evening_id;
  END IF;
END $$;
