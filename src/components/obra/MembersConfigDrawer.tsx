import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { ConstructionMember } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import type { CompanyUser, JobSiteMemberInput } from "@/lib/api";

interface MembersConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constructionId: string;
  initialMembers: ConstructionMember[];
  users: CompanyUser[];
  onSave: (members: JobSiteMemberInput[]) => Promise<void>;
}

function makeDraftMember(constructionId: string, user: CompanyUser | undefined, sharePercent: number, index: number): ConstructionMember {
  return {
    id: `draft-m-${Date.now()}-${index}`,
    constructionId,
    userId: user?.id ?? "",
    name: user?.name ?? "Sócio",
    email: user?.email ?? "",
    sharePercent,
  };
}

export function MembersConfigDrawer({ open, onOpenChange, constructionId, initialMembers, users, onSave }: MembersConfigDrawerProps) {
  const [members, setMembers] = useState<ConstructionMember[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Importante: "ADMIN" é uma permissão de governança, não necessariamente um impeditivo de participação.
  // O backend continua garantindo que somente ADMIN pode ALTERAR a configuração.
  const selectableUsers = useMemo(() => users, [users]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);

    if (initialMembers.length > 0) {
      setMembers(initialMembers.map((m) => ({ ...m })));
      return;
    }

    // Rascunho padrão apenas para permitir que o admin comece a editar.
    if (selectableUsers.length >= 2) {
      setMembers([
        makeDraftMember(constructionId, selectableUsers[0], 50, 0),
        makeDraftMember(constructionId, selectableUsers[1], 50, 1),
      ]);
      return;
    }

    if (selectableUsers.length === 1) {
      setMembers([makeDraftMember(constructionId, selectableUsers[0], 100, 0)]);
      return;
    }

    setMembers([]);
  }, [open, constructionId, initialMembers, selectableUsers]);

  const totalPercent = members.reduce((acc, m) => acc + (Number(m.sharePercent) || 0), 0);

  const updateMember = (index: number, field: "name" | "sharePercent" | "userId", value: string) => {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        if (field === "sharePercent") return { ...m, sharePercent: Number(value) || 0 };
        if (field === "userId") {
          const user = usersById.get(value);
          return { ...m, userId: value, name: user?.name ?? m.name, email: user?.email ?? m.email };
        }
        return { ...m, [field]: value };
      })
    );
    setError("");
  };

  const addMember = () => {
    const rest = 100 - members.reduce((a, m) => a + (Number(m.sharePercent) || 0), 0);
    const next = selectableUsers.find((u) => !members.some((m) => m.userId === u.id));
    if (!next) {
      setError("Não há mais usuários disponíveis para adicionar.");
      return;
    }
    const sharePercent = Math.max(0, Math.round(rest));
    setMembers((prev) => [...prev, makeDraftMember(constructionId, next, sharePercent, prev.length)]);
    setError("");
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      setError("É necessário pelo menos um sócio.");
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const sum = members.reduce((acc, m) => acc + (Number(m.sharePercent) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setError(`A participação deve somar 100%. Atual: ${sum.toFixed(1)}%`);
        return;
      }
      if (members.some((m) => !m.userId)) {
        setError("Selecione um usuário para cada sócio.");
        return;
      }

      const uniqueUserIds = new Set(members.map((m) => m.userId));
      if (uniqueUserIds.size !== members.length) {
        setError("Há sócios duplicados na configuração.");
        return;
      }

      const payload: JobSiteMemberInput[] = members.map((m, i) => ({
        userId: m.userId,
        name: (m.name || "").trim(),
        sharePercent: Number(m.sharePercent) || 0,
        sortIndex: i,
      }));

      await onSave(payload);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao salvar participação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Participação na obra</DrawerTitle>
          <p className="text-sm text-muted-foreground font-normal">Defina os sócios e a porcentagem de cada um. A soma deve ser 100%.</p>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {members.map((m, index) => (
            <div key={m.id} className="flex gap-2 items-end border border-border rounded-lg p-3 bg-card">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Sócio</Label>
                <select
                  value={m.userId}
                  onChange={(e) => updateMember(index, "userId", e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-base"
                  disabled={saving}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {selectableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <Label className="text-xs">Nome (snapshot)</Label>
                <Input
                  value={m.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Nome do sócio"
                  className="h-10"
                  disabled={saving}
                />
              </div>

              <div className="w-20 space-y-1">
                <Label className="text-xs">%</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={m.sharePercent}
                  onChange={(e) => updateMember(index, "sharePercent", e.target.value)}
                  className="h-10 font-mono"
                  disabled={saving}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeMember(index)}
                disabled={members.length <= 1 || saving}
                aria-label="Remover sócio"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addMember} className="w-full gap-2" disabled={saving}>
            <Plus className="w-4 h-4" />
            Adicionar sócio
          </Button>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Total:</span>
            <span className={`font-mono font-bold ${Math.abs(totalPercent - 100) < 0.01 ? "text-primary" : "text-destructive"}`}>
              {totalPercent.toFixed(1)}%
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button size="lg" className="w-full h-12 font-bold" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar participação"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
