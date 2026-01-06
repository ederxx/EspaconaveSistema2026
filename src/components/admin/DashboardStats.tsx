import { Users, Calendar, Music, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsProps {
  artistsCount: number;
  bookingsCount: number;
  productionsCount: number;
  activeProductionsCount: number;
}

export function DashboardStats({
  artistsCount,
  bookingsCount,
  productionsCount,
  activeProductionsCount,
}: StatsProps) {
  const stats = [
    {
      title: "Artistas",
      value: artistsCount,
      icon: Users,
      description: "Artistas cadastrados",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Reservas",
      value: bookingsCount,
      icon: Calendar,
      description: "Este mês",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      title: "Produções",
      value: productionsCount,
      icon: Music,
      description: "Total de produções",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      title: "Em Andamento",
      value: activeProductionsCount,
      icon: Radio,
      description: "Produções ativas",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
