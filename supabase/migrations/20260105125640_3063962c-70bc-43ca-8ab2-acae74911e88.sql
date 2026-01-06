-- Create table for carousel highlights
CREATE TABLE public.carousel_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  button_text TEXT DEFAULT 'Saiba Mais',
  button_link TEXT DEFAULT '#',
  tag TEXT DEFAULT 'Destaque',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_highlights ENABLE ROW LEVEL SECURITY;

-- Anyone can view active highlights
CREATE POLICY "Anyone can view active highlights"
ON public.carousel_highlights
FOR SELECT
USING (is_active = true);

-- Admins can view all highlights
CREATE POLICY "Admins can view all highlights"
ON public.carousel_highlights
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage highlights
CREATE POLICY "Admins can manage highlights"
ON public.carousel_highlights
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_carousel_highlights_updated_at
  BEFORE UPDATE ON public.carousel_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default highlights
INSERT INTO public.carousel_highlights (title, subtitle, description, image_url, tag, position) VALUES
('Maria Santos', 'Nova Voz do MPB', 'Descubra o talento que está revolucionando a música brasileira contemporânea.', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=800&fit=crop', 'Artista em Destaque', 1),
('Horizonte Infinito', 'Novo Álbum • João Silva', '12 faixas que exploram as fronteiras entre o eletrônico e o orgânico.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop', 'Lançamento', 2),
('Estúdio Renovado', 'Novas instalações inauguradas', 'Equipamentos de última geração para produções de qualidade internacional.', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=800&fit=crop', 'Notícias', 3),
('Rádio 24 Horas', 'Sempre no ar', 'O melhor da produção do estúdio, 24 horas por dia, 7 dias por semana.', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=800&fit=crop', 'Ao Vivo', 4);