ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seat_block text,
  ADD COLUMN IF NOT EXISTS seat_row text,
  ADD COLUMN IF NOT EXISTS seat_numbers text,
  ADD COLUMN IF NOT EXISTS seat_entrance text;