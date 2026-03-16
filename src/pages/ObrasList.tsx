import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { CONSTRUCTIONS } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const ObrasList = () => {
  const [search, setSearch] = useState('');
  const filtered = CONSTRUCTIONS.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileShell>
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight mb-4">Obras</h1>
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
          {filtered.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma obra encontrada</p>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default ObrasList;
