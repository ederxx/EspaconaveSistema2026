import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Production {
  id: string;
  title: string;
  status: string;
  production_type: string;
  created_at: string;
}

interface Booking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface RecentActivityProps {
  productions: Production[];
  bookings: Booking[];
}

const statusLabels: Record<string, string> = {
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
  awaiting_feedback: "Aguardando retorno",
};

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  awaiting_feedback: "bg-orange-500/20 text-orange-400",
};

const typeLabels: Record<string, string> = {
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

export function RecentActivity({ productions, bookings }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Productions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Produções Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {productions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma produção encontrada
            </p>
          ) : (
            productions.map((production) => (
              <div
                key={production.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div>
                  <p className="font-medium text-sm">{production.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[production.production_type] || production.production_type}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[production.status]}
                >
                  {statusLabels[production.status] || production.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Próximas Reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma reserva encontrada
            </p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div>
                  <p className="font-medium text-sm">{booking.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(booking.start_time), "dd MMM, HH:mm", { locale: ptBR })} -{" "}
                    {format(new Date(booking.end_time), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Agendado
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
