import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const ObrasList = () => {
  const { constructions, isLoading, error, refresh } = useConstructions();
  const [search, setSearch] = useState('');
  const filtered = constructions.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileShell>
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight mb-4">Obras</h1>
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
            className="pl-9 h-12 text-base"
          />
        </div>
        <div className="space-y-3">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          )}
          {filtered.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma obra encontrada</p>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default ObrasList;
