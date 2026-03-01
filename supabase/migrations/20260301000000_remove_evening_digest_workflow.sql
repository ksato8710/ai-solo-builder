-- Remove evening digest workflow (夕刊キュレーション) and its source mappings
-- Evening digest has been discontinued; only morning digest remains.

DELETE FROM workflow_source_mappings
WHERE workflow_code = 'digest-evening-curation';

DELETE FROM content_workflows
WHERE code = 'digest-evening-curation';
