import { useState, useEffect } from "react";
import { Instagram, Music, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  name: string;
  stage_name: string | null;
  bio: string | null;
  photo_url: string | null;
  genres: string[] | null;
  featured: boolean;
}

const ArtistsSection = () => {
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from("artists")
          .select("id, name, stage_name, bio, photo_url, genres, featured")
          .eq("is_active", true)
          .order("featured", { ascending: false })
          .order("name", { ascending: true });

        if (error) throw error;
        setArtists(data || []);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (isLoading) {
    return (
      <section id="artistas" className="py-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section id="artistas" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <p className="text-primary font-medium mb-4 tracking-widest text-sm uppercase">
              Nosso Elenco
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold">
              Artistas em <span className="text-gradient-lime italic">Destaque</span>
            </h2>
          </div>
          <a
            href="#"
            className="mt-6 md:mt-0 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
          >
            Ver todos os artistas
            <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Featured Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artists.map((artist, index) => (
            <div
              key={artist.id}
              className={`group relative overflow-hidden rounded-2xl bg-card transition-all duration-500 ${
                artist.featured ? "lg:row-span-1" : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredArtist(artist.id)}
              onMouseLeave={() => setHoveredArtist(null)}
            >
              {/* Image */}
              <div className="aspect-[4/5] overflow-hidden">
                {artist.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Music className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Genre Tag */}
                {artist.genres && artist.genres.length > 0 && (
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full mb-3 border border-primary/20">
                    {artist.genres.join(" • ")}
                  </span>
                )}

                {/* Name */}
                <h3 className="font-display text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {artist.stage_name || artist.name}
                </h3>

                {/* Bio - Shows on hover */}
                {artist.bio && (
                  <p
                    className={`text-sm text-muted-foreground transition-all duration-300 ${
                      hoveredArtist === artist.id
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    {artist.bio}
                  </p>
                )}

                {/* Social Links - Shows on hover */}
                <div
                  className={`flex gap-3 mt-4 transition-all duration-300 ${
                    hoveredArtist === artist.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: "100ms" }}
                >
                  <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:text-primary hover:bg-secondary/80 transition-colors">
                    <Instagram size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:text-primary hover:bg-secondary/80 transition-colors">
                    <Music size={18} />
                  </button>
                </div>
              </div>

              {/* Featured Badge */}
              {artist.featured && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    Destaque
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtistsSection;
