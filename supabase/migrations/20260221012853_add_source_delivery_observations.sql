BEGIN;

CREATE TABLE IF NOT EXISTS public.source_delivery_observations (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  collector_inbox text NOT NULL DEFAULT 'ktlabworks@gmail.com',
  observed_at timestamptz NOT NULL,
  subject text NOT NULL,
  from_email text NOT NULL,
  message_id_header text,
  gmail_thread_id text,
  gmail_message_id text,
  gmail_labels text[] NOT NULL DEFAULT ARRAY[]::text[],
  read_online_url text,
  archive_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.source_delivery_observations
    ADD CONSTRAINT chk_source_delivery_observations_collector_inbox
    CHECK (position('@' IN collector_inbox) > 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_source_delivery_observations_source_observed
  ON public.source_delivery_observations (source_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_delivery_observations_observed
  ON public.source_delivery_observations (observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_delivery_observations_collector
  ON public.source_delivery_observations (collector_inbox, observed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_delivery_observations_source_message_id
  ON public.source_delivery_observations (source_id, message_id_header)
  WHERE message_id_header IS NOT NULL;

DROP TRIGGER IF EXISTS trg_source_delivery_observations_set_updated_at
  ON public.source_delivery_observations;

CREATE TRIGGER trg_source_delivery_observations_set_updated_at
BEFORE UPDATE ON public.source_delivery_observations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
