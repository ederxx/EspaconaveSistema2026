import { useState, useEffect, useRef } from "react";
import { Pause, Play, Radio, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface LiveSession {
  id: string;
  admin_name: string | null;
  is_live: boolean;
  current_track_url: string | null;
  current_track_name: string | null;
}

interface LoopTrack {
  id: string;
  audio_url: string;
  track_name: string;
  is_active: boolean;
}

const RadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [loopTrack, setLoopTrack] = useState<LoopTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchLiveSession();
    fetchLoopTrack();
    setupRealtimeSubscription();
  }, []);

  // Auto-play loop track when loaded
  useEffect(() => {
    if (!hasAutoPlayed && !isLoading && loopTrack?.audio_url && audioRef.current && !liveSession?.is_live) {
      audioRef.current.src = loopTrack.audio_url;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasAutoPlayed(true);
        })
        .catch((err) => {
          console.log("Autoplay blocked by browser:", err);
          setHasAutoPlayed(true);
        });
    }
  }, [isLoading, loopTrack, liveSession, hasAutoPlayed]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('landing-radio-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_live_session'
        },
        (payload) => {
          console.log('Live session update:', payload);
          if (payload.eventType === 'DELETE') {
            setLiveSession(null);
          } else {
            const session = payload.new as LiveSession;
            setLiveSession(session);
            
            if (session.is_live && session.current_track_url && audioRef.current) {
              audioRef.current.src = session.current_track_url;
              if (isPlaying) {
                audioRef.current.play();
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_loop_track'
        },
        () => {
          fetchLoopTrack();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchLiveSession = async () => {
    try {
      const { data } = await supabase
        .from("radio_live_session")
        .select("*")
        .eq("is_live", true)
        .maybeSingle();

      if (data) {
        setLiveSession(data);
      }
    } catch (error) {
      console.error("Error fetching live session:", error);
    }
  };

  const fetchLoopTrack = async () => {
    try {
      const { data } = await supabase
        .from("radio_loop_track")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        setLoopTrack(data);
      }
    } catch (error) {
      console.error("Error fetching loop track:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup audio source based on live session or loop track
  useEffect(() => {
    if (!audioRef.current) return;

    if (liveSession?.is_live && liveSession.current_track_url) {
      audioRef.current.src = liveSession.current_track_url;
      audioRef.current.loop = false;
    } else if (loopTrack?.audio_url) {
      audioRef.current.src = loopTrack.audio_url;
      audioRef.current.loop = true;
    }
  }, [liveSession, loopTrack]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    const hasAudio = liveSession?.is_live 
      ? !!liveSession.current_track_url 
      : !!loopTrack?.audio_url;

    if (!hasAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isLive = liveSession?.is_live;
  const hasAudio = isLive ? !!liveSession.current_track_url : !!loopTrack?.audio_url;
  const currentTrackName = isLive 
    ? liveSession.current_track_name || "Transmissão ao vivo"
    : loopTrack?.track_name || "Rádio 24h";

  return (
    <section id="radio" className="py-24 bg-gradient-radial">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Radio className={`w-4 h-4 ${isLive ? 'text-red-500' : 'text-primary'}`} />
            <span className={`text-sm font-medium ${isLive ? 'text-red-500' : 'text-primary'}`}>
              {isLive ? 'AO VIVO' : 'No Ar'}
            </span>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-red-500' : 'bg-primary'}`} />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Rádio <span className="text-gradient-lime">24 Horas</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isLive 
              ? `${liveSession.admin_name || 'Um DJ'} está transmitindo ao vivo agora!`
              : 'O melhor da nossa produção, tocando sem parar.'
            }
          </p>
        </div>

        {/* Simplified Player */}
        <div className="max-w-4xl mx-auto">
          <div className={`glass rounded-3xl p-8 md:p-10 ${isLive ? 'border-2 border-red-500/30' : ''}`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !hasAudio ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">Nenhuma faixa configurada no momento</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 py-4">
                {/* Play/Pause Button */}
                <Button
                  size="lg"
                  variant={isLive ? "destructive" : "lime"}
                  className="w-16 h-16 rounded-full shadow-glow"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7" />
                  ) : (
                    <Play className="w-7 h-7 ml-1" />
                  )}
                </Button>

                {/* Track Info */}
                <div className="text-left">
                  <p className={`text-xs font-medium mb-1 ${isLive ? 'text-red-500' : 'text-primary'}`}>
                    {isLive ? '🔴 Ao Vivo' : '🎵 Em Loop'}
                  </p>
                  <h3 className="font-display text-xl md:text-2xl font-bold">
                    {currentTrackName}
                  </h3>
                  {isLive && liveSession.admin_name && (
                    <p className="text-sm text-muted-foreground">
                      com {liveSession.admin_name}
                    </p>
                  )}
                </div>

                {/* Equalizer Animation */}
                {isPlaying && (
                  <div className="flex items-end gap-1 h-8 ml-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full ${isLive ? 'bg-red-500' : 'bg-primary'}`}
                        style={{
                          height: `${Math.random() * 100}%`,
                          animation: `equalizer 0.5s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Embeds Section */}
            <div className="mt-10 pt-8 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-6 text-center uppercase tracking-wider">
                Playlists & Mixes
              </h4>
              <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                <div className="rounded-xl overflow-hidden">
                  <iframe
                    width="100%"
                    height="120"
                    src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Feder-cruz2%2F"
                    frameBorder="0"
                    allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;"
                  />
                </div>
                <div className="rounded-xl overflow-hidden">
                  <iframe
                    style={{ borderRadius: "12px" }}
                    src="https://open.spotify.com/embed/playlist/6sd19JvXB5WhQ2AHClZmIO?utm_source=generator&theme=0"
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RadioPlayer;
