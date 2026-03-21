import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/app-config';
import type { ConstructionStatus } from '@/types';

type FilterStatus = 'all' | ConstructionStatus;

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'EM_ANDAMENTO', label: 'Em andamento' },
  { key: 'ENTREGUE', label: 'Entregues' },
  { key: 'VENDIDA', label: 'Vendidas' },
  { key: 'PAUSADA', label: 'Pausadas' },
];

const ObrasList = () => {
  const { constructions, isLoading, error, refresh } = useConstructions();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('EM_ANDAMENTO');

  const filtered = useMemo(() => {
    let list = constructions;
    if (filterStatus !== 'all') {
      list = list.filter((c) => c.status === filterStatus);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.address ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [constructions, filterStatus, search]);

  return (
    <MobileShell>
      <div className="px-4 py-6 min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Suas obras</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar obra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-12 text-base rounded-xl border-border bg-card/80"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                filterStatus === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card/80 text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="space-y-3 mt-4">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          )}
          {filtered.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {search || filterStatus !== 'all'
                ? 'Nenhuma obra encontrada com esses filtros'
                : 'Nenhuma obra cadastrada'}
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default ObrasList;
