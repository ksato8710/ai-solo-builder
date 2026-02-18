BEGIN;

-- Subscriber status enum
DO $$ BEGIN
  CREATE TYPE public.subscriber_status AS ENUM (
    'pending_verification',
    'active',
    'unsubscribed',
    'bounced',
    'complained'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  email text NOT NULL UNIQUE
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  status public.subscriber_status NOT NULL DEFAULT 'pending_verification',
  verify_token uuid NOT NULL UNIQUE DEFAULT extensions.gen_random_uuid(),
  verified_at timestamptz,
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT extensions.gen_random_uuid(),
  unsubscribed_at timestamptz,
  unsubscribe_reason text,
  ip_address text,
  user_agent text,
  tier text NOT NULL DEFAULT 'free',
  preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON public.newsletter_subscribers (status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON public.newsletter_subscribers (email);

DROP TRIGGER IF EXISTS trg_newsletter_subscribers_set_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_set_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Newsletter send logs
CREATE TABLE IF NOT EXISTS public.newsletter_send_logs (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  digest_content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  subject text NOT NULL,
  send_date date NOT NULL,
  total_recipients integer NOT NULL DEFAULT 0,
  successful_sends integer NOT NULL DEFAULT 0,
  failed_sends integer NOT NULL DEFAULT 0,
  errors jsonb DEFAULT '[]',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_send_logs_date
  ON public.newsletter_send_logs (send_date DESC);

DROP TRIGGER IF EXISTS trg_newsletter_send_logs_set_updated_at ON public.newsletter_send_logs;
CREATE TRIGGER trg_newsletter_send_logs_set_updated_at
BEFORE UPDATE ON public.newsletter_send_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS: service_role only (no anon/authenticated access)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_send_logs ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated
-- service_role bypasses RLS by default

COMMIT;
