import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Search, User, Star } from "lucide-react";
import { toast } from "sonner";

interface Artist {
  id: string;
  name: string;
  stage_name: string | null;
  bio: string | null;
  photo_url: string | null;
  genres: string[] | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    stage_name: "",
    bio: "",
    photo_url: "",
    genres: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Erro ao carregar artistas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (artist?: Artist) => {
    if (artist) {
      setEditingArtist(artist);
      setFormData({
        name: artist.name,
        stage_name: artist.stage_name || "",
        bio: artist.bio || "",
        photo_url: artist.photo_url || "",
        genres: artist.genres?.join(", ") || "",
      });
    } else {
      setEditingArtist(null);
      setFormData({
        name: "",
        stage_name: "",
        bio: "",
        photo_url: "",
        genres: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSaving(true);

    try {
      const artistData = {
        name: formData.name.trim(),
        stage_name: formData.stage_name.trim() || null,
        bio: formData.bio.trim() || null,
        photo_url: formData.photo_url.trim() || null,
        genres: formData.genres
          ? formData.genres.split(",").map((g) => g.trim()).filter(Boolean)
          : null,
      };

      if (editingArtist) {
        const { error } = await supabase
          .from("artists")
          .update(artistData)
          .eq("id", editingArtist.id);

        if (error) throw error;
        toast.success("Artista atualizado com sucesso");
      } else {
        const { error } = await supabase.from("artists").insert([artistData]);

        if (error) throw error;
        toast.success("Artista criado com sucesso");
      }

      setIsDialogOpen(false);
      fetchArtists();
    } catch (error) {
      console.error("Error saving artist:", error);
      toast.error("Erro ao salvar artista");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este artista?")) return;

    try {
      const { error } = await supabase.from("artists").delete().eq("id", id);

      if (error) throw error;
      toast.success("Artista excluído com sucesso");
      fetchArtists();
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast.error("Erro ao excluir artista");
    }
  };

  const handleToggleActive = async (artist: Artist) => {
    try {
      const { error } = await supabase
        .from("artists")
        .update({ is_active: !artist.is_active })
        .eq("id", artist.id);

      if (error) throw error;
      toast.success(
        artist.is_active ? "Artista desativado" : "Artista ativado"
      );
      fetchArtists();
    } catch (error) {
      console.error("Error toggling artist:", error);
      toast.error("Erro ao atualizar artista");
    }
  };

  const handleToggleFeatured = async (artist: Artist) => {
    try {
      const { error } = await supabase
        .from("artists")
        .update({ featured: !artist.featured })
        .eq("id", artist.id);

      if (error) throw error;
      toast.success(
        artist.featured ? "Removido do destaque" : "Adicionado ao destaque"
      );
      fetchArtists();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erro ao atualizar destaque");
    }
  };

  const filteredArtists = artists.filter(
    (artist) =>
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.stage_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artistas</h1>
          <p className="text-muted-foreground">
            Gerencie os artistas cadastrados no estúdio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="lime" onClick={() => handleOpenDialog()}>
              <Plus size={18} />
              Novo Artista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingArtist ? "Editar Artista" : "Novo Artista"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage_name">Nome Artístico</Label>
                <Input
                  id="stage_name"
                  value={formData.stage_name}
                  onChange={(e) =>
                    setFormData({ ...formData, stage_name: e.target.value })
                  }
                  placeholder="Nome artístico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Breve biografia do artista"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">URL da Foto</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, photo_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genres">Gêneros (separados por vírgula)</Label>
                <Input
                  id="genres"
                  value={formData.genres}
                  onChange={(e) =>
                    setFormData({ ...formData, genres: e.target.value })
                  }
                  placeholder="Pop, Rock, Eletrônico"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button variant="lime" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          placeholder="Buscar artistas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtists.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum artista encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredArtists.map((artist) => (
            <Card
              key={artist.id}
              className={`bg-card border-border ${
                !artist.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {artist.photo_url ? (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <User className="text-muted-foreground" size={24} />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{artist.name}</CardTitle>
                      {artist.stage_name && (
                        <p className="text-sm text-muted-foreground">
                          {artist.stage_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {artist.featured && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/20 text-primary"
                      >
                        <Star size={12} className="mr-1 fill-current" />
                        Destaque
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className={
                        artist.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      {artist.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {artist.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {artist.bio}
                  </p>
                )}
                {artist.genres && artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {artist.genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="secondary"
                        className="text-xs"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(artist)}
                  >
                    <Pencil size={14} />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={artist.featured ? "default" : "outline"}
                    className={artist.featured ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => handleToggleFeatured(artist)}
                  >
                    <Star size={14} className={artist.featured ? "fill-current" : ""} />
                    {artist.featured ? "Destaque" : "Destacar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(artist)}
                  >
                    {artist.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(artist.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
