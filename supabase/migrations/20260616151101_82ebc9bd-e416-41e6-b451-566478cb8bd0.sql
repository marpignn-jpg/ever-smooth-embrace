
-- Tighten the public order insert policy
DROP POLICY IF EXISTS "Public can create order" ON public.orders;
CREATE POLICY "Public can create order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    amount > 0
    AND ticket_id IS NOT NULL
    AND event_id IS NOT NULL
    AND status = 'pending'
  );

-- Restrict has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
