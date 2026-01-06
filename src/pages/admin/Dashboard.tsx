import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { Loader2 } from "lucide-react";

interface DashboardData {
  artistsCount: number;
  bookingsCount: number;
  productionsCount: number;
  activeProductionsCount: number;
  recentProductions: any[];
  upcomingBookings: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all counts and data in parallel
      const [
        artistsResult,
        bookingsResult,
        productionsResult,
        activeProductionsResult,
        recentProductionsResult,
        upcomingBookingsResult,
      ] = await Promise.all([
        supabase.from("artists").select("id", { count: "exact", head: true }),
        supabase.from("schedule_bookings").select("id", { count: "exact", head: true }),
        supabase.from("productions").select("id", { count: "exact", head: true }),
        supabase
          .from("productions")
          .select("id", { count: "exact", head: true })
          .eq("status", "in_progress"),
        supabase
          .from("productions")
          .select("id, title, status, production_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("schedule_bookings")
          .select("id, title, start_time, end_time")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(5),
      ]);

      setData({
        artistsCount: artistsResult.count || 0,
        bookingsCount: bookingsResult.count || 0,
        productionsCount: productionsResult.count || 0,
        activeProductionsCount: activeProductionsResult.count || 0,
        recentProductions: recentProductionsResult.data || [],
        upcomingBookings: upcomingBookingsResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do estúdio Espaço Nave
        </p>
      </div>

      {data && (
        <>
          <DashboardStats
            artistsCount={data.artistsCount}
            bookingsCount={data.bookingsCount}
            productionsCount={data.productionsCount}
            activeProductionsCount={data.activeProductionsCount}
          />
          <RecentActivity
            productions={data.recentProductions}
            bookings={data.upcomingBookings}
          />
        </>
      )}
    </div>
  );
}
