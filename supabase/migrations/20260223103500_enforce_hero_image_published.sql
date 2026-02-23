-- Enforce hero_image_url for published news/digest articles
-- Prevents status='published' when hero_image_url is null for news/digest

CREATE OR REPLACE FUNCTION enforce_hero_image_for_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when status is being set to 'published'
  IF NEW.status = 'published' THEN
    -- Check if content_type is news or digest
    IF NEW.content_type IN ('news', 'digest') THEN
      -- Require hero_image_url
      IF NEW.hero_image_url IS NULL OR NEW.hero_image_url = '' THEN
        RAISE EXCEPTION 'hero_image_url is required for published % articles. slug: %', 
          NEW.content_type, NEW.slug;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_hero_image_published_trigger ON contents;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER enforce_hero_image_published_trigger
  BEFORE INSERT OR UPDATE ON contents
  FOR EACH ROW
  EXECUTE FUNCTION enforce_hero_image_for_published();

COMMENT ON FUNCTION enforce_hero_image_for_published() IS 
  'Ensures news/digest articles have hero_image_url when published. Added 2026-02-23.';
