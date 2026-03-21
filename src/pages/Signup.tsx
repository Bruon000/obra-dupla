import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

export default function Signup() {
  const navigate = useNavigate();
  const { registerAccount, isAuthenticated } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!companyName.trim() || !adminName.trim() || !email.trim() || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await registerAccount({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/15 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-[72px] h-[72px] rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {APP_TAGLINE} — Crie sua equipe e comece o trial
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="company">Nome da equipe / empresa</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex.: Dupla Silva Construções"
              className="h-11 mt-1"
              disabled={loading}
              autoComplete="organization"
            />
          </div>
          <div>
            <Label htmlFor="admin">Seu nome</Label>
            <Input
              id="admin"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Como aparece no app"
              className="h-11 mt-1"
              disabled={loading}
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail (será o login)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 mt-1"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="h-11 mt-1"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <Button type="submit" size="lg" className="w-full h-12 text-base font-bold" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta e entrar"}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Ao cadastrar, você inicia um período de testes conforme o plano gratuito configurado no servidor.
        </p>
        <p className="text-sm text-center text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-semibold underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
