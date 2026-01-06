import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";

interface Booking {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
}

export default function Schedule() {
  const { user, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchBookings();
  }, [currentWeek]);

  const fetchBookings = async () => {
    try {
      const startDate = weekStart.toISOString();
      const endDate = addDays(weekStart, 7).toISOString();

      const { data, error } = await supabase
        .from("schedule_bookings")
        .select("*")
        .gte("start_time", startDate)
        .lt("start_time", endDate)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Erro ao carregar agenda");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (booking?: Booking) => {
    // Only admins can edit existing bookings
    if (booking && !isAdmin) {
      toast.error("Apenas administradores podem editar reservas");
      return;
    }

    if (booking) {
      setEditingBooking(booking);
      const startDate = new Date(booking.start_time);
      const endDate = new Date(booking.end_time);
      setFormData({
        title: booking.title,
        description: booking.description || "",
        date: format(startDate, "yyyy-MM-dd"),
        start_time: format(startDate, "HH:mm"),
        end_time: format(endDate, "HH:mm"),
      });
    } else {
      setEditingBooking(null);
      setFormData({
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "10:00",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.date || !formData.start_time || !formData.end_time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Only admins can edit
    if (editingBooking && !isAdmin) {
      toast.error("Apenas administradores podem editar reservas");
      return;
    }

    setIsSaving(true);

    try {
      const start_time = new Date(`${formData.date}T${formData.start_time}:00`).toISOString();
      const end_time = new Date(`${formData.date}T${formData.end_time}:00`).toISOString();

      const bookingData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time,
        end_time,
        user_id: user?.id,
      };

      if (editingBooking) {
        const { error } = await supabase
          .from("schedule_bookings")
          .update(bookingData)
          .eq("id", editingBooking.id);

        if (error) throw error;
        toast.success("Reserva atualizada com sucesso");
      } else {
        const { error } = await supabase.from("schedule_bookings").insert([bookingData]);

        if (error) throw error;
        toast.success("Reserva criada com sucesso");
      }

      setIsDialogOpen(false);
      fetchBookings();
    } catch (error) {
      console.error("Error saving booking:", error);
      toast.error("Erro ao salvar reserva");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Only admins can delete
    if (!isAdmin) {
      toast.error("Apenas administradores podem excluir reservas");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta reserva?")) return;

    try {
      const { error } = await supabase.from("schedule_bookings").delete().eq("id", id);

      if (error) throw error;
      toast.success("Reserva excluída com sucesso");
      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Erro ao excluir reserva");
    }
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) =>
      isSameDay(new Date(booking.start_time), day)
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie as reservas do estúdio
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="lime" onClick={() => handleOpenDialog()}>
              <Plus size={18} />
              Nova Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBooking ? "Editar Reserva" : "Nova Reserva"}
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
                  placeholder="Ex: Gravação de vocal"
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
                  placeholder="Detalhes da reserva"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Início *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Término *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
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

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft size={18} />
          Semana anterior
        </Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, "dd MMM", { locale: ptBR })} -{" "}
          {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          Próxima semana
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <Card
            key={day.toISOString()}
            className={`min-h-[200px] ${
              isSameDay(day, new Date())
                ? "border-primary/50 bg-primary/5"
                : "bg-card"
            }`}
          >
            <CardHeader className="py-3 px-3">
              <CardTitle className="text-sm font-medium">
                <span className="block text-xs text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: ptBR })}
                </span>
                <span
                  className={`${
                    isSameDay(day, new Date()) ? "text-primary" : ""
                  }`}
                >
                  {format(day, "dd")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 space-y-1">
              {getBookingsForDay(day).map((booking) => (
                <div
                  key={booking.id}
                  className="p-2 rounded bg-primary/10 border border-primary/20 group cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {booking.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(booking.start_time), "HH:mm")} -{" "}
                        {format(new Date(booking.end_time), "HH:mm")}
                      </p>
                    </div>
                    {/* Only show edit/delete buttons for admins */}
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenDialog(booking)}
                          className="p-1 hover:bg-primary/20 rounded"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="p-1 hover:bg-destructive/20 rounded text-destructive"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
