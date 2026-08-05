CREATE TABLE public.kyc_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  email text not null,
  buyer_name text,
  event_name text,
  target_url text not null,
  deadline text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_requests TO anon;
GRANT ALL ON public.kyc_requests TO service_role;

ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage kyc requests" ON public.kyc_requests FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_kyc_requests_updated_at BEFORE UPDATE ON public.kyc_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX kyc_requests_token_idx ON public.kyc_requests (token);