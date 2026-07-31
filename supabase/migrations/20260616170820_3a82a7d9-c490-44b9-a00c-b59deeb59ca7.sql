ALTER TABLE public.orders ALTER COLUMN ticket_id DROP NOT NULL;

DROP POLICY IF EXISTS "Public can create order" ON public.orders;
CREATE POLICY "Public can create order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  amount > 0
  AND event_id IS NOT NULL
  AND status = 'pending'::order_status
);