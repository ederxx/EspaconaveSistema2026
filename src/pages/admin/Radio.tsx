import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Radio as RadioIcon,
  Loader2,
  Upload,
  Play,
  Pause,
  Volume2,
  Trash2,
  Plus,
  Mic,
  MicOff,
  Music,
  Zap,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface LiveSession {
  id: string;
  admin_id: string;
  admin_name: string | null;
  is_live: boolean;
  current_track_url: string | null;
  current_track_name: string | null;
  started_at: string;
}

interface SoundEffect {
  id: string;
  name: string;
  audio_url: string;
  created_at: string;
}

interface LoopTrack {
  id: string;
  audio_url: string;
  track_name: string;
  is_active: boolean;
}

export default function Radio() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>([]);
  const [loopTrack, setLoopTrack] = useState<LoopTrack | null>(null);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [isUploadingEffect, setIsUploadingEffect] = useState(false);
  const [isUploadingLoop, setIsUploadingLoop] = useState(false);
  const [effectDialogOpen, setEffectDialogOpen] = useState(false);
  const [newEffectName, setNewEffectName] = useState("");
  const [newEffectFile, setNewEffectFile] = useState<File | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const loopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('radio-live-session')
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
            setLiveSession(payload.new as LiveSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    try {
      const [sessionRes, effectsRes, loopRes] = await Promise.all([
        supabase
          .from("radio_live_session")
          .select("*")
          .eq("is_live", true)
          .maybeSingle(),
        supabase
          .from("radio_sound_effects")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("radio_loop_track")
          .select("*")
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      if (sessionRes.data) setLiveSession(sessionRes.data);
      if (effectsRes.data) setSoundEffects(effectsRes.data);
      if (loopRes.data) setLoopTrack(loopRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!user) return;

    setIsGoingLive(true);
    try {
      const { data: existingSession } = await supabase
        .from("radio_live_session")
        .select("*")
        .eq("is_live", true)
        .maybeSingle();

      if (existingSession && existingSession.admin_id !== user.id) {
        toast.error(`${existingSession.admin_name || 'Outro administrador'} já está ao vivo!`);
        setIsGoingLive(false);
        return;
      }

      if (existingSession) {
        await supabase
          .from("radio_live_session")
          .update({ is_live: false })
          .eq("id", existingSession.id);
        setLiveSession(null);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        toast.success("Você saiu do ar!");
      } else {
        const { data, error } = await supabase
          .from("radio_live_session")
          .insert({
            admin_id: user.id,
            admin_name: user.email?.split('@')[0] || 'Admin',
            is_live: true,
          })
          .select()
          .single();

        if (error) throw error;
        setLiveSession(data);
        toast.success("Você está ao vivo!");
      }
    } catch (error) {
      console.error("Error toggling live:", error);
      toast.error("Erro ao alterar status");
    } finally {
      setIsGoingLive(false);
    }
  };

  const handleUploadTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !liveSession) return;

    if (!file.type.includes('audio')) {
      toast.error("Por favor, selecione um arquivo de áudio");
      return;
    }

    setIsUploadingTrack(true);
    try {
      const fileName = `live-tracks/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("radio-audio")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("radio-audio")
        .getPublicUrl(fileName);

      await supabase
        .from("radio_live_session")
        .update({
          current_track_url: urlData.publicUrl,
          current_track_name: file.name,
        })
        .eq("id", liveSession.id);

      toast.success("Faixa carregada! Tocando agora...");
      
      if (audioRef.current) {
        audioRef.current.src = urlData.publicUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error uploading track:", error);
      toast.error("Erro ao carregar faixa");
    } finally {
      setIsUploadingTrack(false);
      if (trackInputRef.current) {
        trackInputRef.current.value = "";
      }
    }
  };

  const handleUploadLoopTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      toast.error("Por favor, selecione um arquivo de áudio");
      return;
    }

    setIsUploadingLoop(true);
    try {
      const fileName = `loop-tracks/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("radio-audio")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("radio-audio")
        .getPublicUrl(fileName);

      // Deactivate existing loop tracks
      await supabase
        .from("radio_loop_track")
        .update({ is_active: false })
        .eq("is_active", true);

      // Insert new loop track
      const { data, error } = await supabase
        .from("radio_loop_track")
        .insert({
          audio_url: urlData.publicUrl,
          track_name: file.name,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setLoopTrack(data);
      toast.success("Faixa de loop configurada!");
    } catch (error) {
      console.error("Error uploading loop track:", error);
      toast.error("Erro ao carregar faixa de loop");
    } finally {
      setIsUploadingLoop(false);
      if (loopInputRef.current) {
        loopInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLoopTrack = async () => {
    if (!loopTrack) return;
    if (!confirm("Tem certeza que deseja remover a faixa de loop?")) return;

    try {
      const { error } = await supabase
        .from("radio_loop_track")
        .update({ is_active: false })
        .eq("id", loopTrack.id);

      if (error) throw error;

      setLoopTrack(null);
      toast.success("Faixa de loop removida!");
    } catch (error) {
      console.error("Error removing loop track:", error);
      toast.error("Erro ao remover faixa");
    }
  };

  const handleAddSoundEffect = async () => {
    if (!newEffectName.trim() || !newEffectFile) {
      toast.error("Nome e arquivo são obrigatórios");
      return;
    }

    setIsUploadingEffect(true);
    try {
      const fileName = `sound-effects/${Date.now()}-${newEffectFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("radio-audio")
        .upload(fileName, newEffectFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("radio-audio")
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from("radio_sound_effects")
        .insert({
          name: newEffectName.trim(),
          audio_url: urlData.publicUrl,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success("Efeito sonoro adicionado!");
      setEffectDialogOpen(false);
      setNewEffectName("");
      setNewEffectFile(null);
      fetchData();
    } catch (error) {
      console.error("Error adding sound effect:", error);
      toast.error("Erro ao adicionar efeito");
    } finally {
      setIsUploadingEffect(false);
    }
  };

  const handleDeleteSoundEffect = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este efeito?")) return;

    try {
      const { error } = await supabase
        .from("radio_sound_effects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Efeito excluído!");
      fetchData();
    } catch (error) {
      console.error("Error deleting effect:", error);
      toast.error("Erro ao excluir efeito");
    }
  };

  const playEffect = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isMySession = liveSession?.admin_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rádio Ao Vivo</h1>
        <p className="text-muted-foreground">
          Entre ao vivo e toque músicas diretamente no site
        </p>
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Mic size={16} />
            Ao Vivo
          </TabsTrigger>
          <TabsTrigger value="loop" className="flex items-center gap-2">
            <Repeat size={16} />
            Loop
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Zap size={16} />
            Efeitos
          </TabsTrigger>
          <TabsTrigger value="embeds" className="flex items-center gap-2">
            <Music size={16} />
            Playlists
          </TabsTrigger>
        </TabsList>

        {/* Live Tab */}
        <TabsContent value="live" className="space-y-6">
          <Card className={liveSession?.is_live ? "border-red-500 bg-red-500/5" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <RadioIcon className={liveSession?.is_live ? "text-red-500 animate-pulse" : ""} />
                Status da Transmissão
                {liveSession?.is_live && (
                  <Badge variant="destructive" className="animate-pulse">
                    AO VIVO
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {liveSession?.is_live && !isMySession && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400">
                    <strong>{liveSession.admin_name}</strong> está ao vivo no momento.
                    Aguarde a transmissão terminar para entrar ao vivo.
                  </p>
                </div>
              )}

              <Button
                size="lg"
                variant={isMySession ? "destructive" : "lime"}
                onClick={handleGoLive}
                disabled={isGoingLive || (liveSession?.is_live && !isMySession)}
                className="w-full sm:w-auto"
              >
                {isGoingLive ? (
                  <Loader2 className="animate-spin mr-2" size={20} />
                ) : isMySession ? (
                  <MicOff className="mr-2" size={20} />
                ) : (
                  <Mic className="mr-2" size={20} />
                )}
                {isMySession ? "Sair do Ar" : "Entrar Ao Vivo"}
              </Button>

              {isMySession && (
                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      ref={trackInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleUploadTrack}
                      className="hidden"
                      id="track-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => trackInputRef.current?.click()}
                      disabled={isUploadingTrack}
                    >
                      {isUploadingTrack ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      ) : (
                        <Upload className="mr-2" size={18} />
                      )}
                      Carregar Música (MP3)
                    </Button>
                  </div>

                  {liveSession.current_track_name && (
                    <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                      <Button size="icon" variant="ghost" onClick={togglePlayPause}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </Button>
                      <div className="flex-1">
                        <p className="font-medium">{liveSession.current_track_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isPlaying ? "Tocando agora" : "Pausado"}
                        </p>
                      </div>
                      <Volume2 className="text-muted-foreground" size={20} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loop Tab */}
        <TabsContent value="loop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat size={20} />
                Faixa em Loop (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Configure uma faixa MP3 que ficará tocando em loop continuamente quando não houver transmissão ao vivo.
              </p>

              {loopTrack ? (
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Repeat className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{loopTrack.track_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Tocando em loop
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLoopTrack}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Repeat className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma faixa de loop configurada
                  </p>
                </div>
              )}

              <div>
                <input
                  ref={loopInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleUploadLoopTrack}
                  className="hidden"
                  id="loop-upload"
                />
                <Button
                  variant="lime"
                  onClick={() => loopInputRef.current?.click()}
                  disabled={isUploadingLoop}
                >
                  {isUploadingLoop ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <Upload className="mr-2" size={18} />
                  )}
                  {loopTrack ? "Substituir Faixa" : "Carregar Faixa de Loop"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} />
                Efeitos Sonoros
              </CardTitle>
              <Button variant="lime" onClick={() => setEffectDialogOpen(true)}>
                <Plus size={18} className="mr-2" />
                Adicionar Efeito
              </Button>
            </CardHeader>
            <CardContent>
              {soundEffects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum efeito sonoro cadastrado
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {soundEffects.map((effect) => (
                    <div key={effect.id} className="group relative">
                      <Button
                        variant="outline"
                        className="w-full h-20 flex flex-col gap-1 hover:bg-primary/10 hover:border-primary"
                        onClick={() => playEffect(effect.audio_url)}
                      >
                        <Zap size={20} />
                        <span className="text-xs truncate w-full px-1">
                          {effect.name}
                        </span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDeleteSoundEffect(effect.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embeds Tab */}
        <TabsContent value="embeds" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mixcloud</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  width="100%"
                  height="120"
                  src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Feder-cruz2%2F"
                  frameBorder="0"
                  allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;"
                  className="rounded-lg"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spotify</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Effect Dialog */}
      <Dialog open={effectDialogOpen} onOpenChange={setEffectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Efeito Sonoro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="effect-name">Nome do Efeito</Label>
              <Input
                id="effect-name"
                value={newEffectName}
                onChange={(e) => setNewEffectName(e.target.value)}
                placeholder="Ex: Aplausos, Risadas, Buzina..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effect-file">Arquivo de Áudio</Label>
              <Input
                id="effect-file"
                type="file"
                accept="audio/*"
                onChange={(e) => setNewEffectFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              className="w-full"
              variant="lime"
              onClick={handleAddSoundEffect}
              disabled={isUploadingEffect}
            >
              {isUploadingEffect ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Plus size={18} className="mr-2" />
              )}
              Adicionar Efeito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
