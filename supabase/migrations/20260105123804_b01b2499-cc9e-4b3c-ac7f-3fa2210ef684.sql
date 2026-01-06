-- Create storage bucket for radio audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('radio-audio', 'radio-audio', true);

-- Storage policies for radio audio
CREATE POLICY "Anyone can view radio audio" ON storage.objects FOR SELECT USING (bucket_id = 'radio-audio');
CREATE POLICY "Admins can upload radio audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'radio-audio' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update radio audio" ON storage.objects FOR UPDATE USING (bucket_id = 'radio-audio' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete radio audio" ON storage.objects FOR DELETE USING (bucket_id = 'radio-audio' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Table to track live radio session
CREATE TABLE public.radio_live_session (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  admin_name TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  current_track_url TEXT,
  current_track_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_live_session ENABLE ROW LEVEL SECURITY;

-- RLS policies for live session
CREATE POLICY "Anyone can view live session" ON public.radio_live_session FOR SELECT USING (true);
CREATE POLICY "Admins can manage live session" ON public.radio_live_session FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Table for sound effects
CREATE TABLE public.radio_sound_effects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radio_sound_effects ENABLE ROW LEVEL SECURITY;

-- RLS policies for sound effects
CREATE POLICY "Anyone can view sound effects" ON public.radio_sound_effects FOR SELECT USING (true);
CREATE POLICY "Admins can manage sound effects" ON public.radio_sound_effects FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Enable realtime for live session
ALTER PUBLICATION supabase_realtime ADD TABLE public.radio_live_session;

-- Trigger for updated_at
CREATE TRIGGER update_radio_live_session_updated_at
BEFORE UPDATE ON public.radio_live_session
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();