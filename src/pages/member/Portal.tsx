import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Calendar,
  MessageSquare,
  Music,
  Loader2,
  Send,
  Inbox,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  id: string;
  full_name: string;
  stage_name: string | null;
  avatar_url: string | null;
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
}

interface Message {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  is_admin_message: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string | null;
}

export default function MemberPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchData();
      setupRealtimeMessages();
    }
  }, [user, authLoading]);

  const setupRealtimeMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel("member-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [newMessage, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info("Nova mensagem recebida!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("schedule_bookings")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(5);

      setBookings(bookingsData || []);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

      setMessages(messagesData || []);
      setUnreadCount(
        messagesData?.filter((m) => !m.is_read && m.recipient_id === user.id)
          .length || 0
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hoursUsed = profile?.hours_used_this_month || 0;
  const hoursLimit = profile?.monthly_hours_limit || 10;
  const hoursRemaining = Math.max(0, hoursLimit - hoursUsed);
  const hoursPercentage = (hoursUsed / hoursLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-24">
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {profile?.full_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              Olá, {profile?.stage_name || profile?.full_name || "Membro"}!
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas produções e horas disponíveis
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/membro/perfil")}
          >
            <Pencil size={16} className="mr-2" />
            Editar Perfil
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Hours Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Suas Horas de Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Horas utilizadas este mês
                  </span>
                  <span className="font-mono font-medium">
                    {hoursUsed}h / {hoursLimit}h
                  </span>
                </div>
                <Progress value={hoursPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">
                    Horas Restantes
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {hoursRemaining}h
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">
                    Limite Diário
                  </p>
                  <p className="text-3xl font-bold">
                    {profile?.daily_hours_limit || 4}h
                  </p>
                </div>
              </div>

              <Button
                variant="lime"
                className="w-full"
                onClick={() => navigate("/membro/agendar")}
                disabled={hoursRemaining <= 0}
              >
                <Calendar className="mr-2" size={18} />
                {hoursRemaining > 0
                  ? "Agendar Produção"
                  : "Sem Horas Disponíveis"}
              </Button>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma mensagem
                </p>
              ) : (
                messages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border ${
                      !msg.is_read && msg.recipient_id === user?.id
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender_id === user?.id ? (
                        <Send size={12} className="text-muted-foreground" />
                      ) : (
                        <Inbox size={12} className="text-primary" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {msg.sender_id === user?.id ? "Enviada" : "Recebida"}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/membro/mensagens")}
              >
                Ver Todas as Mensagens
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum agendamento futuro
                </p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="text-primary" size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{booking.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(booking.start_time),
                            "dd 'de' MMMM 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(
                          (new Date(booking.end_time).getTime() -
                            new Date(booking.start_time).getTime()) /
                            3600000
                        )}
                        h
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/membro/mensagens?new=true")}
              >
                <Send size={18} className="mr-2" />
                Enviar Mensagem ao Admin
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/membro/agendar")}
              >
                <Calendar size={18} className="mr-2" />
                Ver Agenda Completa
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
