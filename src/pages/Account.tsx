import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { changeOwnPassword } from "@/lib/api";

export default function Account() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk(false);
    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não coincide com a nova senha.");
      return;
    }
    setSaving(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setOk(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileShell>
      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Minha conta</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <KeyRound className="w-5 h-5" />
            <h2 className="text-xs uppercase tracking-widest font-bold">Alterar senha</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Qualquer utilizador (sócio ou admin) pode trocar a própria senha aqui, sem precisar de outra pessoa.
          </p>

          {ok ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">Senha alterada com sucesso.</div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label>Senha atual</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 mt-1"
                disabled={saving}
                required
              />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 mt-1"
                disabled={saving}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 mt-1"
                disabled={saving}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 font-bold" disabled={saving}>
              {saving ? "A guardar…" : "Guardar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </MobileShell>
  );
}
