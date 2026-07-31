CREATE TABLE public.email_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  event_name text,
  subject text,
  tokens text[] NOT NULL DEFAULT '{}',
  download_url text,
  ticket_infos jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'sent',
  resend_count integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_history TO anon, authenticated;
GRANT ALL ON public.email_history TO service_role;

ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_history readable" ON public.email_history FOR SELECT USING (true);
CREATE POLICY "email_history insertable" ON public.email_history FOR INSERT WITH CHECK (true);
CREATE POLICY "email_history updatable" ON public.email_history FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX idx_email_history_sent_at ON public.email_history(last_sent_at DESC);