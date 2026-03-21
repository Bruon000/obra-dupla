import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, listUsers, type CompanyUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Users() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [saving, setSaving] = useState(false);

  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === "ADMIN";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [editPassword, setEditPassword] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
  }, [users]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listUsers();
      setUsers(list);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar usuários");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha nome, e-mail e senha.");
      return;
    }
    setSaving(true);
    try {
      const created = await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("MEMBER");
    } catch (e: any) {
      setError(e?.message ?? "Falha ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (u: CompanyUser) => {
    setEditingId(u.id);
    setEditName(u.name ?? "");
    setEditEmail(u.email ?? "");
    setEditRole((u.role === "ADMIN" ? "ADMIN" : "MEMBER") as "ADMIN" | "MEMBER");
    setEditPassword("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPassword("");
    setError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditingSaving(true);
    setError("");
    try {
      const { updateUser } = await import("@/lib/api");
      const updated = await updateUser(editingId, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      });
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      cancelEdit();
    } catch (e: any) {
      setError(e?.message ?? "Falha ao editar usuário");
    } finally {
      setEditingSaving(false);
    }
  };

  return (
    <MobileShell>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usuários são sempre criados dentro da mesma empresa (\(companyId\)) do usuário logado.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={loading || saving}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Criar usuário</h2>
          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 mt-1" disabled={saving} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-11 mt-1" disabled={saving} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="h-11 mt-1" disabled={saving} />
            </div>
            <div>
              <Label>Papel</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base mt-1 disabled:opacity-50"
                disabled={saving}
              >
                <option value="MEMBER">Sócio</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button type="submit" size="lg" className="w-full h-12 font-bold" disabled={saving}>
              {saving ? "Criando..." : "Criar usuário"}
            </Button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Usuários da empresa</h2>
            <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={loading || saving}>
              Atualizar
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          ) : sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((u) => (
                <div key={u.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                      {u.role === "ADMIN" ? "Admin" : "Sócio"}
                    </span>
                  </div>

                  {isAdmin ? (
                    editingId === u.id ? (
                      <div className="mt-3 space-y-2">
                        <div className="space-y-1">
                          <Label>Nome</Label>
                          <Input className="h-10" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={editingSaving} />
                        </div>
                        <div className="space-y-1">
                          <Label>E-mail</Label>
                          <Input
                            className="h-10"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            type="email"
                            disabled={editingSaving}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Papel</Label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as "ADMIN" | "MEMBER")}
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50"
                            disabled={editingSaving}
                          >
                            <option value="MEMBER">Sócio</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label>Nova senha (opcional)</Label>
                          <Input
                            className="h-10"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            type="password"
                            placeholder="Deixe em branco para manter"
                            disabled={editingSaving}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={editingSaving} className="flex-1">
                            {editingSaving ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={editingSaving}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(u)} disabled={editingSaving} className="flex-1">
                          Editar
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

