import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Clock,
  Loader2,
  Pencil,
  RotateCcw,
  Plus,
  Image,
  Trash2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  stage_name: string | null;
  monthly_hours_limit: number;
  daily_hours_limit: number;
  hours_used_this_month: number;
  hours_reset_date: string | null;
  role?: string;
}

interface CarouselHighlight {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  tag: string | null;
  position: number;
  is_active: boolean;
}

export default function Settings() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [highlights, setHighlights] = useState<CarouselHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Highlight editing
  const [editingHighlight, setEditingHighlight] = useState<CarouselHighlight | null>(null);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [highlightForm, setHighlightForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    button_text: "Saiba Mais",
    button_link: "#",
    tag: "Destaque",
    is_active: true,
  });

  const [editForm, setEditForm] = useState({
    monthly_hours_limit: 10,
    daily_hours_limit: 4,
    hours_used_this_month: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchHighlights();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "member",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from("carousel_highlights")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error("Error fetching highlights:", error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(
        newRole === "admin"
          ? "Privilégio de admin concedido!"
          : "Privilégio de admin removido"
      );
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar permissão");
    }
  };

  const handleOpenEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      monthly_hours_limit: user.monthly_hours_limit || 10,
      daily_hours_limit: user.daily_hours_limit || 4,
      hours_used_this_month: user.hours_used_this_month || 0,
    });
    setEditDialogOpen(true);
  };

  const handleSaveHours = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          monthly_hours_limit: editForm.monthly_hours_limit,
          daily_hours_limit: editForm.daily_hours_limit,
          hours_used_this_month: editForm.hours_used_this_month,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("Horas atualizadas com sucesso!");
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving hours:", error);
      toast.error("Erro ao salvar horas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetHours = async (userId: string) => {
    if (!confirm("Tem certeza que deseja resetar as horas deste usuário?"))
      return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          hours_used_this_month: 0,
          hours_reset_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Horas resetadas!");
      fetchUsers();
    } catch (error) {
      console.error("Error resetting hours:", error);
      toast.error("Erro ao resetar horas");
    }
  };

  const handleAddHours = async (userId: string) => {
    const hours = prompt("Quantas horas adicionar?", "5");
    if (!hours) return;

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          monthly_hours_limit: (user.monthly_hours_limit || 10) + hoursNum,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`${hoursNum} horas adicionadas ao limite mensal!`);
      fetchUsers();
    } catch (error) {
      console.error("Error adding hours:", error);
      toast.error("Erro ao adicionar horas");
    }
  };

  // Highlight functions
  const handleOpenHighlightDialog = (highlight?: CarouselHighlight) => {
    if (highlight) {
      setEditingHighlight(highlight);
      setHighlightForm({
        title: highlight.title,
        subtitle: highlight.subtitle,
        description: highlight.description || "",
        image_url: highlight.image_url || "",
        button_text: highlight.button_text || "Saiba Mais",
        button_link: highlight.button_link || "#",
        tag: highlight.tag || "Destaque",
        is_active: highlight.is_active,
      });
    } else {
      setEditingHighlight(null);
      setHighlightForm({
        title: "",
        subtitle: "",
        description: "",
        image_url: "",
        button_text: "Saiba Mais",
        button_link: "#",
        tag: "Destaque",
        is_active: true,
      });
    }
    setHighlightDialogOpen(true);
  };

  const handleSaveHighlight = async () => {
    if (!highlightForm.title || !highlightForm.subtitle) {
      toast.error("Título e subtítulo são obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      if (editingHighlight) {
        const { error } = await supabase
          .from("carousel_highlights")
          .update({
            title: highlightForm.title,
            subtitle: highlightForm.subtitle,
            description: highlightForm.description || null,
            image_url: highlightForm.image_url || null,
            button_text: highlightForm.button_text,
            button_link: highlightForm.button_link,
            tag: highlightForm.tag,
            is_active: highlightForm.is_active,
          })
          .eq("id", editingHighlight.id);

        if (error) throw error;
        toast.success("Destaque atualizado!");
      } else {
        const maxPosition = Math.max(...highlights.map((h) => h.position), 0);
        const { error } = await supabase.from("carousel_highlights").insert({
          title: highlightForm.title,
          subtitle: highlightForm.subtitle,
          description: highlightForm.description || null,
          image_url: highlightForm.image_url || null,
          button_text: highlightForm.button_text,
          button_link: highlightForm.button_link,
          tag: highlightForm.tag,
          is_active: highlightForm.is_active,
          position: maxPosition + 1,
        });

        if (error) throw error;
        toast.success("Destaque criado!");
      }

      setHighlightDialogOpen(false);
      fetchHighlights();
    } catch (error) {
      console.error("Error saving highlight:", error);
      toast.error("Erro ao salvar destaque");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este destaque?")) return;

    try {
      const { error } = await supabase
        .from("carousel_highlights")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Destaque excluído!");
      fetchHighlights();
    } catch (error) {
      console.error("Error deleting highlight:", error);
      toast.error("Erro ao excluir destaque");
    }
  };

  const handleToggleHighlightActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("carousel_highlights")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;
      fetchHighlights();
    } catch (error) {
      console.error("Error toggling highlight:", error);
      toast.error("Erro ao atualizar destaque");
    }
  };

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
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, permissões, horas e destaques do carrossel
        </p>
      </div>

      {/* Carousel Highlights Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Destaques do Carrossel
          </CardTitle>
          <Button variant="lime" size="sm" onClick={() => handleOpenHighlightDialog()}>
            <Plus size={16} className="mr-1" />
            Novo Destaque
          </Button>
        </CardHeader>
        <CardContent>
          {highlights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum destaque cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    highlight.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <GripVertical className="text-muted-foreground" size={20} />
                  
                  {highlight.image_url && (
                    <img
                      src={highlight.image_url}
                      alt={highlight.title}
                      className="w-20 h-14 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {highlight.tag}
                      </Badge>
                      {!highlight.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold truncate">{highlight.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {highlight.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={highlight.is_active}
                      onCheckedChange={() =>
                        handleToggleHighlightActive(highlight.id, highlight.is_active)
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenHighlightDialog(highlight)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteHighlight(highlight.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário cadastrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nome Artístico</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead className="text-center">Horas/Mês</TableHead>
                    <TableHead className="text-center">Horas/Dia</TableHead>
                    <TableHead className="text-center">Usadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.stage_name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                          className={
                            user.role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }
                        >
                          {user.role === "admin" ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            "Membro"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono">
                          {user.monthly_hours_limit || 10}h
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono">
                          {user.daily_hours_limit || 4}h
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-mono ${
                            (user.hours_used_this_month || 0) >=
                            (user.monthly_hours_limit || 10)
                              ? "text-destructive"
                              : ""
                          }`}
                        >
                          {user.hours_used_this_month || 0}h
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditDialog(user)}
                            title="Editar horas"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetHours(user.id)}
                            title="Resetar horas"
                          >
                            <RotateCcw size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddHours(user.id)}
                            title="Adicionar horas"
                          >
                            <Plus size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              user.role === "admin" ? "destructive" : "default"
                            }
                            onClick={() =>
                              handleToggleAdmin(user.id, user.role || "member")
                            }
                          >
                            <Shield size={16} className="mr-1" />
                            {user.role === "admin"
                              ? "Remover Admin"
                              : "Tornar Admin"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hours Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Sobre as Horas de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>
            <strong>Horas/Mês:</strong> Limite máximo de horas de produção que o
            usuário pode usar no mês.
          </p>
          <p>
            <strong>Horas/Dia:</strong> Limite máximo de horas que podem ser
            usadas em um único dia.
          </p>
          <p>
            <strong>Usadas:</strong> Quantidade de horas já utilizadas no mês
            atual.
          </p>
        </CardContent>
      </Card>

      {/* Edit Hours Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar Horas - {editingUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monthly">Limite Mensal (horas)</Label>
              <Input
                id="monthly"
                type="number"
                min="0"
                value={editForm.monthly_hours_limit}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    monthly_hours_limit: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily">Limite Diário (horas)</Label>
              <Input
                id="daily"
                type="number"
                min="0"
                value={editForm.daily_hours_limit}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    daily_hours_limit: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="used">Horas Usadas Este Mês</Label>
              <Input
                id="used"
                type="number"
                min="0"
                step="0.5"
                value={editForm.hours_used_this_month}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    hours_used_this_month: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <Button
              className="w-full"
              variant="lime"
              onClick={handleSaveHours}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <SettingsIcon size={18} className="mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Highlight Dialog */}
      <Dialog open={highlightDialogOpen} onOpenChange={setHighlightDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingHighlight ? "Editar Destaque" : "Novo Destaque"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="h-title">Título (Nome Grande)</Label>
              <Input
                id="h-title"
                value={highlightForm.title}
                onChange={(e) =>
                  setHighlightForm({ ...highlightForm, title: e.target.value })
                }
                placeholder="Ex: Maria Santos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-subtitle">Subtítulo</Label>
              <Input
                id="h-subtitle"
                value={highlightForm.subtitle}
                onChange={(e) =>
                  setHighlightForm({ ...highlightForm, subtitle: e.target.value })
                }
                placeholder="Ex: Nova Voz do MPB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-desc">Descrição</Label>
              <Textarea
                id="h-desc"
                value={highlightForm.description}
                onChange={(e) =>
                  setHighlightForm({ ...highlightForm, description: e.target.value })
                }
                placeholder="Descrição do destaque..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-image">URL da Imagem</Label>
              <Input
                id="h-image"
                value={highlightForm.image_url}
                onChange={(e) =>
                  setHighlightForm({ ...highlightForm, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="h-tag">Tag</Label>
                <Input
                  id="h-tag"
                  value={highlightForm.tag}
                  onChange={(e) =>
                    setHighlightForm({ ...highlightForm, tag: e.target.value })
                  }
                  placeholder="Ex: Lançamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="h-btn-text">Texto do Botão</Label>
                <Input
                  id="h-btn-text"
                  value={highlightForm.button_text}
                  onChange={(e) =>
                    setHighlightForm({ ...highlightForm, button_text: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-btn-link">Link do Botão</Label>
              <Input
                id="h-btn-link"
                value={highlightForm.button_link}
                onChange={(e) =>
                  setHighlightForm({ ...highlightForm, button_link: e.target.value })
                }
                placeholder="#radio ou https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="h-active"
                checked={highlightForm.is_active}
                onCheckedChange={(checked) =>
                  setHighlightForm({ ...highlightForm, is_active: checked })
                }
              />
              <Label htmlFor="h-active">Ativo</Label>
            </div>
            <Button
              className="w-full"
              variant="lime"
              onClick={handleSaveHighlight}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Image size={18} className="mr-2" />
              )}
              {editingHighlight ? "Salvar Alterações" : "Criar Destaque"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
