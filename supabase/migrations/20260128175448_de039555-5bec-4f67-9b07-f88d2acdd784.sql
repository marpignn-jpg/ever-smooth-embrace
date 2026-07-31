-- Create payment_links table
CREATE TABLE public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read available links (for checkout)
CREATE POLICY "Anyone can read available payment links"
  ON public.payment_links
  FOR SELECT
  USING (status = 'available');

-- Policy: Anyone can update a link to mark it as used
CREATE POLICY "Anyone can mark link as used"
  ON public.payment_links
  FOR UPDATE
  USING (status = 'available')
  WITH CHECK (status = 'used');

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_links;