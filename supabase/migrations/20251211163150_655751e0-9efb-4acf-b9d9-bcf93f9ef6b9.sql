
-- Create radio_tracks table for the 24h radio
CREATE TABLE public.radio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration_seconds INTEGER,
  audio_url TEXT,
  cover_url TEXT,
  description TEXT,
  genres TEXT[],
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radio_playlists table
CREATE TABLE public.radio_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.radio_playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.radio_tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, track_id)
);

-- Create radio_queue table for the current queue
CREATE TABLE public.radio_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.radio_tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radio_history table for play history
CREATE TABLE public.radio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.radio_tracks(id) ON DELETE CASCADE NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_played INTEGER
);

-- Enable RLS on all radio tables
ALTER TABLE public.radio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_history ENABLE ROW LEVEL SECURITY;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_radio_tracks_updated_at
  BEFORE UPDATE ON public.radio_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_radio_playlists_updated_at
  BEFORE UPDATE ON public.radio_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for radio_tracks
CREATE POLICY "Anyone can view active tracks"
  ON public.radio_tracks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all tracks"
  ON public.radio_tracks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tracks"
  ON public.radio_tracks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for radio_playlists
CREATE POLICY "Anyone can view active playlists"
  ON public.radio_playlists FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all playlists"
  ON public.radio_playlists FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage playlists"
  ON public.radio_playlists FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for playlist_tracks
CREATE POLICY "Anyone can view playlist tracks"
  ON public.playlist_tracks FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage playlist tracks"
  ON public.playlist_tracks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for radio_queue
CREATE POLICY "Anyone can view queue"
  ON public.radio_queue FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage queue"
  ON public.radio_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for radio_history
CREATE POLICY "Anyone can view history"
  ON public.radio_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert history"
  ON public.radio_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage history"
  ON public.radio_history FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
