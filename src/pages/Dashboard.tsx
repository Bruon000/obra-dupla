import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { CONSTRUCTIONS } from '@/lib/mock-data';
import { HardHat } from 'lucide-react';

const Dashboard = () => {
  return (
    <MobileShell>
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ObraDupla</h1>
            <p className="text-sm text-muted-foreground">Gestão de obras entre sócios</p>
          </div>
        </div>

        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
          Suas obras
        </h2>
        <div className="space-y-3">
          {CONSTRUCTIONS.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
        </div>
      </div>
    </MobileShell>
  );
};

export default Dashboard;
