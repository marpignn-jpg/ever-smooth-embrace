
-- Allow public writes on events, tickets, orders (admin panel is gated outside Supabase auth)
DROP POLICY IF EXISTS "Admins insert events" ON public.events;
DROP POLICY IF EXISTS "Admins update events" ON public.events;
DROP POLICY IF EXISTS "Admins delete events" ON public.events;
DROP POLICY IF EXISTS "Admins read all events" ON public.events;

CREATE POLICY "Public can manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;

-- Tickets
DROP POLICY IF EXISTS "Admins insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins delete tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins read all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public reads tickets" ON public.tickets;

CREATE POLICY "Public can manage tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO anon, authenticated;

-- Orders
DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;

CREATE POLICY "Public can manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
