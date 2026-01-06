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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Search, Music } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ProductionStatus = "in_progress" | "completed" | "paused" | "awaiting_feedback";
type ProductionType = "music" | "mix_master" | "recording" | "podcast" | "meeting" | "class" | "project" | "multimedia" | "other";

interface Production {
  id: string;
  title: string;
  description: string | null;
  production_type: ProductionType;
  status: ProductionStatus;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<ProductionStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
  awaiting_feedback: "Aguardando retorno",
};

const statusColors: Record<ProductionStatus, string> = {
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  awaiting_feedback: "bg-orange-500/20 text-orange-400",
};

const typeLabels: Record<ProductionType, string> = {
  music: "Música",
  mix_master: "Mix/Master",
  recording: "Gravação",
  podcast: "Podcast",
  meeting: "Reunião",
  class: "Aula",
  project: "Projeto",
  multimedia: "Multimídia",
  other: "Outro",
};

export default function Productions() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    production_type: "music" as ProductionType,
    status: "in_progress" as ProductionStatus,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    try {
      const { data, error } = await supabase
        .from("productions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error("Error fetching productions:", error);
      toast.error("Erro ao carregar produções");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (production?: Production) => {
    if (production) {
      setEditingProduction(production);
      setFormData({
        title: production.title,
        description: production.description || "",
        production_type: production.production_type,
        status: production.status,
      });
    } else {
      setEditingProduction(null);
      setFormData({
        title: "",
        description: "",
        production_type: "music",
        status: "in_progress",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setIsSaving(true);

    try {
      const productionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        production_type: formData.production_type,
        status: formData.status,
      };

      if (editingProduction) {
        const { error } = await supabase
          .from("productions")
          .update(productionData)
          .eq("id", editingProduction.id);

        if (error) throw error;
        toast.success("Produção atualizada com sucesso");
      } else {
        const { error } = await supabase.from("productions").insert([productionData]);

        if (error) throw error;
        toast.success("Produção criada com sucesso");
      }

      setIsDialogOpen(false);
      fetchProductions();
    } catch (error) {
      console.error("Error saving production:", error);
      toast.error("Erro ao salvar produção");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta produção?")) return;

    try {
      const { error } = await supabase.from("productions").delete().eq("id", id);

      if (error) throw error;
      toast.success("Produção excluída com sucesso");
      fetchProductions();
    } catch (error) {
      console.error("Error deleting production:", error);
      toast.error("Erro ao excluir produção");
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProductionStatus) => {
    try {
      const { error } = await supabase
        .from("productions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Status atualizado");
      fetchProductions();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredProductions = productions.filter((production) => {
    const matchesSearch = production.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || production.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold">Produções</h1>
          <p className="text-muted-foreground">
            Gerencie as produções do estúdio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="lime" onClick={() => handleOpenDialog()}>
              <Plus size={18} />
              Nova Produção
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduction ? "Editar Produção" : "Nova Produção"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nome da produção"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalhes da produção"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.production_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, production_type: value as ProductionType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as ProductionStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar produções..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Productions List */}
      <div className="space-y-3">
        {filteredProductions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma produção encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredProductions.map((production) => (
            <Card key={production.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{production.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {typeLabels[production.production_type]}
                        </Badge>
                      </div>
                      {production.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {production.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Atualizado em{" "}
                        {format(new Date(production.updated_at), "dd MMM yyyy, HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={production.status}
                      onValueChange={(value) =>
                        handleStatusChange(production.id, value as ProductionStatus)
                      }
                    >
                      <SelectTrigger className={`w-40 ${statusColors[production.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleOpenDialog(production)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(production.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
