BEGIN;

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

COMMIT;
