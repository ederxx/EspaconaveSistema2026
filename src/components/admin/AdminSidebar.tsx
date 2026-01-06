import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Music,
  Radio,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logoEspaconave from "@/assets/logo-espaconave.jpg";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Artistas", url: "/admin/artists", icon: Users },
  { title: "Agenda", url: "/admin/schedule", icon: Calendar },
  { title: "Produções", url: "/admin/productions", icon: Music },
  { title: "Rádio", url: "/admin/radio", icon: Radio },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img
          src={logoEspaconave}
          alt="Espaço Nave"
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-display text-sm font-bold text-gradient-lime uppercase tracking-wider block">
              Espaço Nave
            </span>
            <span className="text-xs text-muted-foreground">Painel Admin</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive(item.url)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
