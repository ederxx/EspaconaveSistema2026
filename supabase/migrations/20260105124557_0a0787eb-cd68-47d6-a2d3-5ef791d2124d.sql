-- Add production hours configuration to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_hours_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_hours_limit INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS hours_used_this_month NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours_reset_date DATE DEFAULT CURRENT_DATE;

-- Table for loop track configuration
CREATE TABLE public.radio_loop_track (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_url TEXT NOT NULL,
  track_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_loop_track ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view loop track" ON public.radio_loop_track FOR SELECT USING (true);
CREATE POLICY "Admins can manage loop track" ON public.radio_loop_track FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_radio_loop_track_updated_at
BEFORE UPDATE ON public.radio_loop_track
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();