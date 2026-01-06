  import { useState, useEffect } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { ArrowLeft, Rocket, Eye, EyeOff, Loader2 } from "lucide-react";
  import { supabase } from "@/integrations/supabase/client";
  import { toast } from "sonner";
  import logoEspaconave from "@/assets/logo-espaconave.jpg";

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");


const redirectBasedOnRole = async (userId: string) => {
  try {
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Erro ao buscar role:", error);
      navigate("/membro", { replace: true });
      return;
    }

    if (roleData.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/membro", { replace: true });
    }
  } catch (err) {
    console.error("Erro inesperado:", err);
    navigate("/membro", { replace: true });
  }
};


    useEffect(() => {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session?.user) {
            redirectBasedOnRole(session.user.id);
          }
        }
      );

      // Check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          redirectBasedOnRole(session.user.id);
        }
      });

      return () => subscription.unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        if (isSignUp) {
          if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            setIsLoading(false);
            return;
          }

          if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
            setIsLoading(false);
            return;
          }

          const redirectUrl = `${window.location.origin}/`;
          
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (error) {
            if (error.message.includes("already registered")) {
              toast.error("Este email já está cadastrado. Tente fazer login.");
            } else {
              toast.error(error.message);
            }
          } else {
            toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.includes("Invalid login credentials")) {
              toast.error("Email ou senha inválidos");
            } else {
              toast.error(error.message);
            }
          } else {
            toast.success("Login realizado com sucesso!");
          }
        }
      } catch (error) {
        toast.error("Ocorreu um erro. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    const handleGoogleSignIn = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) {
          toast.error("Erro ao entrar com Google: " + error.message);
        }
      } catch (error) {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    };

    return (
      <div className="min-h-screen bg-background flex relative overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-foreground/30 rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 relative z-10">
          <div className="max-w-md w-full mx-auto">
            {/* Back Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-12"
            >
              <ArrowLeft size={16} />
              Voltar ao site
            </Link>

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-8">
                <img
                  src={logoEspaconave}
                  alt="Espaço Nave"
                  className="w-20 h-20 rounded-2xl object-cover shadow-glow"
                />
                <div>
                  <span className="font-display text-2xl font-bold text-gradient-lime uppercase tracking-wider">
                    Espaço Nave
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">Studio de Produção</p>
                </div>
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold mb-3">
                {isSignUp ? "Criar sua conta" : "Bem-vindo de volta"}
              </h1>
              <p className="text-muted-foreground">
                {isSignUp
                  ? "Preencha os dados abaixo para criar sua conta."
                  : "Acesse sua conta para gerenciar suas produções e agenda."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-secondary border-border focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {!isSignUp && (
                    <a
                      href="#"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary border-border focus:border-primary pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="lime"
                size="lg"
                className="w-full h-12 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {isSignUp ? "Criando conta..." : "Entrando..."}
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    {isSignUp ? "Criar conta" : "Entrar"}
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-12"
                onClick={handleGoogleSignIn}
              >
                <GoogleIcon />
                Entrar com Google
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {isSignUp ? "Fazer login" : "Criar conta"}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-space" />
          
          {/* Animated stars */}
          <div className="absolute inset-0">
            {[...Array(100)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-foreground/50 rounded-full animate-twinkle"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Central logo */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
              <img
                src={logoEspaconave}
                alt="Espaço Nave"
                className="w-64 h-64 rounded-3xl object-cover shadow-glow relative z-10"
              />
            </div>
            
            <blockquote className="max-w-md text-center mt-12">
              <p className="font-display text-xl lg:text-2xl font-medium italic text-foreground/90 mb-4">
                "A música é a linguagem universal do cosmos."
              </p>
              <footer className="text-primary font-medium">
                — Espaço Nave Studio
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    );
  };

  export default Login;
