import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  ArrowLeft,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addHours, setHours, setMinutes, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  monthly_hours_limit: number;
  daily_hours_limit: number;
  hours_used_this_month: number;
}

interface Booking {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  user_id: string;
}

// Available hours for booking (8:00 - 20:00)
const AVAILABLE_HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

export default function MemberSchedule() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableStartHours, setAvailableStartHours] = useState<number[]>(AVAILABLE_HOURS);

  const [bookingForm, setBookingForm] = useState({
    title: "",
    description: "",
    startHour: "",
    duration: "1",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("monthly_hours_limit, daily_hours_limit, hours_used_this_month")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch all bookings for calendar view
      const { data: bookingsData } = await supabase
        .from("schedule_bookings")
        .select("*")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      setBookings(bookingsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get hours used by current user on a specific date
  const getHoursUsedOnDate = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = addHours(dayStart, 24);

    return bookings
      .filter((b) => b.user_id === user?.id)
      .filter((b) => {
        const bookingStart = new Date(b.start_time);
        return bookingStart >= dayStart && bookingStart < dayEnd;
      })
      .reduce((total, b) => {
        const duration =
          (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) /
          3600000;
        return total + duration;
      }, 0);
  };

  // Get booked time slots for a specific date (all users)
  const getBookedSlotsOnDate = (date: Date): { start: number; end: number }[] => {
    return bookings
      .filter((b) => isSameDay(new Date(b.start_time), date))
      .map((b) => ({
        start: new Date(b.start_time).getHours(),
        end: new Date(b.end_time).getHours(),
      }));
  };

  // Check if a specific hour is available on a date
  const isHourAvailable = (date: Date, hour: number, duration: number = 1): boolean => {
    const bookedSlots = getBookedSlotsOnDate(date);
    const endHour = hour + duration;

    for (const slot of bookedSlots) {
      // Check if there's any overlap
      if (
        (hour >= slot.start && hour < slot.end) ||
        (endHour > slot.start && endHour <= slot.end) ||
        (hour <= slot.start && endHour >= slot.end)
      ) {
        return false;
      }
    }
    return true;
  };

  // Get available start hours for selected date
  const getAvailableStartHours = (date: Date): number[] => {
    return AVAILABLE_HOURS.filter((hour) => isHourAvailable(date, hour, 1));
  };

  // Get max duration available from a start hour
  const getMaxDuration = (date: Date, startHour: number): number => {
    const bookedSlots = getBookedSlotsOnDate(date);
    let maxDuration = 4; // Max 4 hours

    for (const slot of bookedSlots) {
      if (slot.start > startHour) {
        maxDuration = Math.min(maxDuration, slot.start - startHour);
      }
    }

    // Also consider daily limit
    const dailyLimit = profile?.daily_hours_limit || 4;
    const hoursUsedToday = getHoursUsedOnDate(date);
    const remainingDaily = dailyLimit - hoursUsedToday;

    return Math.max(1, Math.min(maxDuration, remainingDaily, 4));
  };

  // Update available hours when date changes
  useEffect(() => {
    if (selectedDate) {
      const available = getAvailableStartHours(selectedDate);
      setAvailableStartHours(available);
      
      // Reset form if current selection is not available
      if (bookingForm.startHour && !available.includes(parseInt(bookingForm.startHour))) {
        setBookingForm((prev) => ({ ...prev, startHour: "", duration: "1" }));
      }
    }
  }, [selectedDate, bookings]);

  const handleCreateBooking = async () => {
    if (!user || !selectedDate || !bookingForm.title || !bookingForm.startHour) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const duration = parseInt(bookingForm.duration);
    const startHour = parseInt(bookingForm.startHour);

    // Double-check availability
    if (!isHourAvailable(selectedDate, startHour, duration)) {
      toast.error("Este horário não está mais disponível. Por favor, escolha outro.");
      fetchData();
      return;
    }

    // Check daily limit
    const hoursUsedToday = getHoursUsedOnDate(selectedDate);
    const dailyLimit = profile?.daily_hours_limit || 4;
    if (hoursUsedToday + duration > dailyLimit) {
      toast.error(
        `Limite diário excedido! Você já usou ${hoursUsedToday}h hoje (limite: ${dailyLimit}h)`
      );
      return;
    }

    // Check monthly limit
    const hoursUsedMonth = profile?.hours_used_this_month || 0;
    const monthlyLimit = profile?.monthly_hours_limit || 10;
    if (hoursUsedMonth + duration > monthlyLimit) {
      toast.error(
        `Limite mensal excedido! Você já usou ${hoursUsedMonth}h (limite: ${monthlyLimit}h)`
      );
      return;
    }

    const startTime = setMinutes(setHours(selectedDate, startHour), 0);
    const endTime = addHours(startTime, duration);

    setIsSaving(true);
    try {
      // Create booking
      const { error: bookingError } = await supabase
        .from("schedule_bookings")
        .insert({
          user_id: user.id,
          title: bookingForm.title,
          description: bookingForm.description || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        });

      if (bookingError) throw bookingError;

      // Update hours used
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          hours_used_this_month: hoursUsedMonth + duration,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("Produção agendada com sucesso!");
      setNewBookingOpen(false);
      setBookingForm({ title: "", description: "", startHour: "", duration: "1" });
      setSelectedDate(undefined);
      fetchData();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Erro ao agendar produção");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hoursRemaining =
    (profile?.monthly_hours_limit || 10) - (profile?.hours_used_this_month || 0);
  const myBookings = bookings.filter((b) => b.user_id === user?.id);

  // Get dates that have bookings (for calendar highlight)
  const getBookedDatesInfo = () => {
    const dateMap = new Map<string, { count: number; isFullyBooked: boolean }>();
    
    bookings.forEach((b) => {
      const dateKey = format(new Date(b.start_time), "yyyy-MM-dd");
      const existing = dateMap.get(dateKey) || { count: 0, isFullyBooked: false };
      existing.count++;
      dateMap.set(dateKey, existing);
    });

    // Check if any date is fully booked (all hours taken)
    dateMap.forEach((info, dateKey) => {
      const date = new Date(dateKey);
      const availableHours = getAvailableStartHours(date);
      info.isFullyBooked = availableHours.length === 0;
    });

    return dateMap;
  };

  const bookedDatesInfo = getBookedDatesInfo();
  const bookedDates = bookings.map((b) => new Date(b.start_time));
  const fullyBookedDates = Array.from(bookedDatesInfo.entries())
    .filter(([_, info]) => info.isFullyBooked)
    .map(([dateKey]) => new Date(dateKey));

  // Get available durations based on selected start hour
  const availableDurations = selectedDate && bookingForm.startHour
    ? Array.from(
        { length: getMaxDuration(selectedDate, parseInt(bookingForm.startHour)) },
        (_, i) => i + 1
      )
    : [1, 2, 3, 4];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/membro")}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Agendar Produção</h1>
            <p className="text-muted-foreground">
              Você tem {hoursRemaining}h disponíveis este mês
            </p>
          </div>
          <Button
            variant="lime"
            onClick={() => setNewBookingOpen(true)}
            disabled={hoursRemaining <= 0}
          >
            <Plus size={18} className="mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Calendário
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Dias em destaque possuem horários ocupados. Dias em vermelho estão lotados.
              </p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date && hoursRemaining > 0) {
                    const available = getAvailableStartHours(date);
                    if (available.length === 0) {
                      toast.error("Este dia está totalmente ocupado");
                    } else {
                      setNewBookingOpen(true);
                    }
                  }
                }}
                locale={ptBR}
                disabled={(date) => {
                  if (date < new Date()) return true;
                  const dateKey = format(date, "yyyy-MM-dd");
                  const info = bookedDatesInfo.get(dateKey);
                  return info?.isFullyBooked || false;
                }}
                modifiers={{
                  booked: bookedDates,
                  fullyBooked: fullyBookedDates,
                }}
                modifiersStyles={{
                  booked: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    borderRadius: "4px",
                  },
                  fullyBooked: {
                    backgroundColor: "hsl(var(--destructive) / 0.2)",
                    color: "hsl(var(--destructive))",
                    borderRadius: "4px",
                  },
                }}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>

          {/* My Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Meus Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum agendamento
                </p>
              ) : (
                myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <h4 className="font-medium">{booking.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(booking.start_time),
                        "dd/MM/yyyy 'das' HH:mm",
                        { locale: ptBR }
                      )}{" "}
                      às {format(new Date(booking.end_time), "HH:mm")}
                    </p>
                    {booking.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Booking Dialog */}
        <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Agendar Produção
                {selectedDate && (
                  <span className="font-normal text-muted-foreground ml-2">
                    - {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {hoursRemaining <= 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle size={18} />
                  <span className="text-sm">
                    Você não tem horas disponíveis este mês
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Título da Produção *</Label>
                <Input
                  id="title"
                  value={bookingForm.title}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, title: e.target.value })
                  }
                  placeholder="Ex: Gravação de voz, Mixagem..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={bookingForm.description}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, description: e.target.value })
                  }
                  placeholder="Detalhes da produção..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Início *</Label>
                  <Select
                    value={bookingForm.startHour}
                    onValueChange={(value) =>
                      setBookingForm({ ...bookingForm, startHour: value, duration: "1" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_HOURS.map((hour) => {
                        const isAvailable = availableStartHours.includes(hour);
                        return (
                          <SelectItem
                            key={hour}
                            value={hour.toString()}
                            disabled={!isAvailable}
                            className={!isAvailable ? "text-muted-foreground line-through" : ""}
                          >
                            {hour.toString().padStart(2, "0")}:00
                            {!isAvailable && " (ocupado)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duração</Label>
                  <Select
                    value={bookingForm.duration}
                    onValueChange={(value) =>
                      setBookingForm({ ...bookingForm, duration: value })
                    }
                    disabled={!bookingForm.startHour}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDurations.map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} hora{hours > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDate && availableStartHours.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-2">Horários disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableStartHours.map((hour) => (
                      <span
                        key={hour}
                        className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                          bookingForm.startHour === hour.toString()
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border hover:border-primary"
                        }`}
                        onClick={() => setBookingForm({ ...bookingForm, startHour: hour.toString(), duration: "1" })}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableStartHours.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle size={18} />
                  <span className="text-sm">
                    Não há horários disponíveis neste dia
                  </span>
                </div>
              )}

              <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted">
                <p>
                  <strong>Limite diário:</strong> {profile?.daily_hours_limit || 4}h
                </p>
                <p>
                  <strong>Horas restantes no mês:</strong> {hoursRemaining}h
                </p>
              </div>

              <Button
                className="w-full"
                variant="lime"
                onClick={handleCreateBooking}
                disabled={isSaving || hoursRemaining <= 0 || !bookingForm.startHour || availableStartHours.length === 0}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <CalendarIcon size={18} className="mr-2" />
                )}
                Confirmar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
