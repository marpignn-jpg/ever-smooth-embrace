CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TYPE public.event_status AS ENUM ('active', 'sold_out', 'cancelled', 'draft');
CREATE TYPE public.seating_type AS ENUM ('numbered', 'free');

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  artist text,
  categories text[] NOT NULL DEFAULT '{}',
  seating_type public.seating_type NOT NULL DEFAULT 'numbered',
  max_tickets_per_order integer NOT NULL DEFAULT 4,
  total_tickets integer,
  face_value numeric(10,2),
  fee_amount numeric,
  apple_pay_enabled boolean NOT NULL DEFAULT true,
  date timestamptz NOT NULL,
  venue text NOT NULL,
  city text,
  image_url text,
  status public.event_status NOT NULL DEFAULT 'draft',
  payment_url_card text,
  payment_url_googlepay text,
  payment_url_applepay text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_events_updated
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.ticket_status AS ENUM ('available', 'reserved', 'sold');

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category text NOT NULL,
  seat text,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  tarif_label text,
  status public.ticket_status NOT NULL DEFAULT 'available',
  resale_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO anon, authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_tickets_updated
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  buyer_first_name text,
  buyer_last_name text,
  buyer_email text,
  buyer_phone text,
  amount numeric(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  resale_token text,
  payment_method text,
  payment_url_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;