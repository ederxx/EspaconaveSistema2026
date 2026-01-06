import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Inbox,
  Loader2,
  ArrowLeft,
  Plus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface AdminUser {
  id: string;
  full_name: string;
}

export default function MemberMessages() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(
    searchParams.get("new") === "true"
  );
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [messageForm, setMessageForm] = useState({
    subject: "",
    content: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchMessages();
      fetchAdmins();
      setupRealtime();
    }
  }, [user, authLoading]);

  const setupRealtime = () => {
    if (!user) return;

    const channel = supabase
      .channel("member-messages-page")
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
          toast.info("Nova mensagem recebida!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      // Get admin user IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", adminIds);

        setAdmins(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !messageForm.subject || !messageForm.content) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSending(true);
    try {
      // Send to first admin or null (admins will see all)
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: admins[0]?.id || null,
        subject: messageForm.subject,
        content: messageForm.content,
        is_admin_message: false,
      });

      if (error) throw error;

      toast.success("Mensagem enviada!");
      setNewMessageOpen(false);
      setMessageForm({ subject: "", content: "" });
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);

    // Mark as read if it's a received message
    if (!message.is_read && message.recipient_id === user?.id) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m))
      );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sentMessages = messages.filter((m) => m.sender_id === user?.id);
  const receivedMessages = messages.filter((m) => m.recipient_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/membro")}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground">
              Comunicação com a administração
            </p>
          </div>
          <Button variant="lime" onClick={() => setNewMessageOpen(true)}>
            <Plus size={18} className="mr-2" />
            Nova Mensagem
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Received Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Recebidas
                {receivedMessages.filter((m) => !m.is_read).length > 0 && (
                  <Badge variant="destructive">
                    {receivedMessages.filter((m) => !m.is_read).length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {receivedMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma mensagem recebida
                </p>
              ) : (
                receivedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleOpenMessage(msg)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                      !msg.is_read ? "bg-primary/5 border-primary/20" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{msg.subject}</span>
                      {msg.is_read ? (
                        <Check size={14} className="text-muted-foreground" />
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sentMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma mensagem enviada
                </p>
              ) : (
                sentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleOpenMessage(msg)}
                    className="p-4 rounded-lg border bg-card cursor-pointer transition-colors hover:bg-accent"
                  >
                    <span className="font-medium truncate block">
                      {msg.subject}
                    </span>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Message Dialog */}
        <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Mensagem para Administração</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={messageForm.subject}
                  onChange={(e) =>
                    setMessageForm({ ...messageForm, subject: e.target.value })
                  }
                  placeholder="Assunto da mensagem"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Mensagem</Label>
                <Textarea
                  id="content"
                  value={messageForm.content}
                  onChange={(e) =>
                    setMessageForm({ ...messageForm, content: e.target.value })
                  }
                  placeholder="Digite sua mensagem..."
                  rows={5}
                />
              </div>
              <Button
                className="w-full"
                variant="lime"
                onClick={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Send size={18} className="mr-2" />
                )}
                Enviar Mensagem
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Message Dialog */}
        <Dialog
          open={!!selectedMessage}
          onOpenChange={() => setSelectedMessage(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                {selectedMessage?.sender_id === user?.id ? (
                  <Badge variant="outline">
                    <Send size={12} className="mr-1" />
                    Enviada por você
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Inbox size={12} className="mr-1" />
                    Recebida
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {selectedMessage &&
                    format(
                      new Date(selectedMessage.created_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-foreground">
                {selectedMessage?.content}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
