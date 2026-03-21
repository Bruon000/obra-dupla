import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/15 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-[72px] h-[72px] rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">{APP_TAGLINE} — Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12 mt-1"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 mt-1"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-bold"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Novo por aqui?{" "}
          <Link to="/cadastro" className="text-primary font-semibold underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
        <p className="text-xs text-center text-muted-foreground">
          Ao entrar, você concorda com o uso do sistema para gestão da sua obra.
        </p>
        <p className="text-[11px] text-center text-muted-foreground/80 mt-2">
          Dev: use <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">dev@obradupla.local</kbd> e senha <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">123456</kbd> (rode o seed da API antes).
        </p>
      </div>
    </div>
  );
}
