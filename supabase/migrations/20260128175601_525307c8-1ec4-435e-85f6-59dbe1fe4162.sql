-- Add policy for inserting new payment links (admin function will use service role)
-- For now, allow authenticated or anon to insert (we'll protect with a password in the UI)
CREATE POLICY "Allow insert for payment links"
  ON public.payment_links
  FOR INSERT
  WITH CHECK (true);

-- Add policy for admin to see all links (including used ones)
CREATE POLICY "Allow select all for admin"
  ON public.payment_links
  FOR SELECT
  USING (true);

-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Anyone can read available payment links" ON public.payment_links;