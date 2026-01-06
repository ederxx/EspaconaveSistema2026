-- Add featured column to artists table
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;