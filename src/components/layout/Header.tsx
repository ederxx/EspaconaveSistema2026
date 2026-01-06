import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Rocket, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoEspaconave from "@/assets/logo-espaconave.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setAvatarUrl(null);
      setUserName(null);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, stage_name")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
      setUserName(data.stage_name || data.full_name);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Artistas", href: "#artistas" },
    { name: "Rádio", href: "#radio" },
  ];

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled ? "w-[95%] max-w-5xl" : "w-[90%] max-w-4xl"
      }`}
    >
      <nav
        className={`glass rounded-full px-6 py-3 flex items-center justify-between transition-all duration-500 ${
          isScrolled ? "shadow-elevated" : ""
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoEspaconave}
            alt="Espaço Nave"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-xl font-display font-bold text-gradient-lime uppercase tracking-wider hidden sm:inline">
            Espaço Nave
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-foreground/70 hover:text-primary transition-colors duration-300 font-medium text-sm tracking-wide"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/membro"} className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-primary/30">
                  <AvatarImage src={avatarUrl || undefined} alt={userName || "User"} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground/80 hidden lg:inline">
                  {userName || "Meu Portal"}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await signOut();
                  toast.success("Logout realizado com sucesso!");
                  navigate("/");
                }}
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="lime" size="sm" className="rounded-full">
                <Rocket size={16} />
                Acessar o Sistema
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 glass rounded-2xl p-4 animate-slide-down">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-foreground/70 hover:text-primary transition-colors py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/membro"} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full">
                    <User size={16} />
                    Meu Portal
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full rounded-full text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await signOut();
                    toast.success("Logout realizado com sucesso!");
                    navigate("/");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="lime" className="w-full rounded-full">
                  <Rocket size={16} />
                  Acessar o Sistema
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
