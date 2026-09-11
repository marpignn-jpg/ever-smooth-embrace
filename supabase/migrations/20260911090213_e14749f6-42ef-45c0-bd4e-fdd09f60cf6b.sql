ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS show_seat_numbers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_details text;