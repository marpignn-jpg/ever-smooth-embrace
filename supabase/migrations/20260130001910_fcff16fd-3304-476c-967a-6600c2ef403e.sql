-- Create contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (contact form is public)
CREATE POLICY "Anyone can send a message"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Allow select for admin (will be validated in code with password)
CREATE POLICY "Allow select for admin"
ON public.contact_messages
FOR SELECT
USING (true);

-- Allow update for admin (to mark as read)
CREATE POLICY "Allow update for admin"
ON public.contact_messages
FOR UPDATE
USING (true);