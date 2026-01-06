import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Artists from "./pages/admin/Artists";
import Schedule from "./pages/admin/Schedule";
import Productions from "./pages/admin/Productions";
import Radio from "./pages/admin/Radio";
import Settings from "./pages/admin/Settings";
import MemberPortal from "./pages/member/Portal";
import MemberMessages from "./pages/member/Messages";
import MemberSchedule from "./pages/member/Schedule";
import MemberProfile from "./pages/member/Profile";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/membro" element={<MemberPortal />} />
              <Route path="/membro/mensagens" element={<MemberMessages />} />
              <Route path="/membro/agendar" element={<MemberSchedule />} />
              <Route path="/membro/perfil" element={<MemberProfile />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="artists" element={<Artists />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="productions" element={<Productions />} />
                <Route path="radio" element={<Radio />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
