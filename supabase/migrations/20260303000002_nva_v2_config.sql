-- NVA V2: MyToolsConfig for workflow_impact scoring
-- Tags match relevance_tags extracted by scorer.ts

INSERT INTO scoring_config (config_key, config_value, description)
VALUES (
  'my_tools',
  '{
    "S": ["claude", "cursor", "vercel", "supabase", "github", "mcp"],
    "A": ["vibe-coding", "ai-agent", "figma", "windsurf"],
    "B": ["openai", "google-ai", "meta-ai", "mistral", "huggingface"]
  }'::jsonb,
  'MyToolsConfig: S=daily use, A=would try, B=might use. Tags match relevance_tags.'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();
