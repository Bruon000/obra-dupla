import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Construction } from '@/types';
import { createJobSite, listJobSites, updateJobSite } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ConstructionsContextValue = {
  constructions: Construction[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addConstruction: (data: Omit<Construction, 'id' | 'createdAt'>) => Promise<Construction>;
  updateConstruction: (id: string, data: Partial<Construction>) => Promise<void>;
};

const ConstructionsContext = createContext<ConstructionsContextValue | null>(null);

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function mapJobSiteToConstruction(js: any): Construction {
  return {
    id: js.id,
    title: js.title ?? "",
    address: js.address ?? "",
    notes: js.notes ?? "",
    status: js.status ?? "EM_ANDAMENTO",
    startDate: toDateOnly(js.startDate) ?? new Date().toISOString().slice(0, 10),
    endDate: toDateOnly(js.endDate),
    saleValue: Number(js.saleValue ?? 0),
    commissionValue: Number(js.commissionValue ?? 0),
    taxValue: Number(js.taxValue ?? 0),
    otherClosingCosts: Number(js.otherClosingCosts ?? 0),
    soldAt: toDateOnly(js.soldAt),
    saleNotes: js.saleNotes ?? "",
    createdAt: toDateOnly(js.createdAt) ?? new Date().toISOString().slice(0, 10),
  };
}

export function ConstructionsProvider({ children }: { children: ReactNode }) {
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setError("");
      setConstructions([]);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const list = await listJobSites();
      setConstructions(list.map(mapJobSiteToConstruction));
    } catch (e: any) {
      setError(e?.message ?? "Falha ao carregar obras");
      setConstructions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) return;
    refresh();
  }, [isAuthLoading, refresh]);

  const addConstruction = useCallback(async (data: Omit<Construction, 'id' | 'createdAt'>) => {
    const created = await createJobSite({
      title: data.title,
      address: data.address,
      notes: data.notes,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      saleValue: data.saleValue,
    });
    const mapped = mapJobSiteToConstruction(created);
    setConstructions((prev) => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
    return mapped;
  }, []);

  const updateConstruction = useCallback(async (id: string, data: Partial<Construction>) => {
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.address !== undefined) patch.address = data.address;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.status !== undefined) patch.status = data.status;
    if (data.startDate !== undefined) patch.startDate = data.startDate;
    if (data.endDate !== undefined) patch.endDate = data.endDate;
    if (data.saleValue !== undefined) patch.saleValue = data.saleValue;
    if (data.commissionValue !== undefined) patch.commissionValue = data.commissionValue;
    if (data.taxValue !== undefined) patch.taxValue = data.taxValue;
    if (data.otherClosingCosts !== undefined) patch.otherClosingCosts = data.otherClosingCosts;
    if (data.soldAt !== undefined) patch.soldAt = data.soldAt;
    if (data.saleNotes !== undefined) patch.saleNotes = data.saleNotes;

    const updated = await updateJobSite(id, patch);
    const mapped = mapJobSiteToConstruction(updated);
    setConstructions((prev) => prev.map((c) => (c.id === id ? { ...c, ...mapped } : c)));
  }, []);

  return (
    <ConstructionsContext.Provider value={{ constructions, isLoading, error, refresh, addConstruction, updateConstruction }}>
      {children}
    </ConstructionsContext.Provider>
  );
}

export function useConstructions() {
  const ctx = useContext(ConstructionsContext);
  if (!ctx) throw new Error('useConstructions must be used within ConstructionsProvider');
  return ctx;
}
