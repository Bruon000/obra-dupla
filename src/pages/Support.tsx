import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { listSupportCompanies, type SupportCompany } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

const STORAGE_SUPPORT_COMPANY_ID = "obra_dupla_support_company_id";

export default function Support() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPlatformSupport = user?.role === "PLATFORM_SUPPORT";

  const [companies, setCompanies] = useState<SupportCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState("");

  useEffect(() => {
    if (!isPlatformSupport) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    listSupportCompanies()
      .then((res) => {
        setCompanies(res);
        setSelectedCompanyId(res[0]?.id ?? "");
      })
      .catch((e: any) => {
        setError(e?.message ?? "Falha ao carregar empresas.");
        setCompanies([]);
      })
      .finally(() => setLoading(false));
  }, [isPlatformSupport]);

  const filtered = useMemo(() => {
    const q = companyFilter.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, companyFilter]);

  const enterSupport = () => {
    if (!selectedCompanyId) return;
    localStorage.setItem(STORAGE_SUPPORT_COMPANY_ID, selectedCompanyId);
    navigate("/obras");
  };

  const exitSupport = () => {
    localStorage.removeItem(STORAGE_SUPPORT_COMPANY_ID);
    navigate("/dashboard");
  };

  return (
    <MobileShell>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Suporte (somente leitura)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione a empresa/tenant para visualizar dados. Nenhuma alteração poderá ser feita.
          </p>
        </div>

        {!isPlatformSupport ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Você não tem permissão para acessar o modo suporte.
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-muted-foreground text-sm">Carregando empresas...</div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Modo leitura</div>
                    <div className="text-sm text-muted-foreground">
                      Qualquer tentativa de escrita será bloqueada e auditada.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Buscar empresa</Label>
                  <Input value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} placeholder="Digite para filtrar..." />
                </div>

                <div className="space-y-2">
                  <Label>Empresa/tenant</Label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="h-12 rounded-lg border border-input bg-background px-3 text-base w-full"
                    disabled={!filtered.length}
                  >
                    {filtered.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={enterSupport} disabled={!selectedCompanyId} className="flex-1">
                    Entrar e visualizar
                  </Button>
                  <Button type="button" variant="outline" onClick={exitSupport}>
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}

