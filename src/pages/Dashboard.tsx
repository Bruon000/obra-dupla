import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { HardHat, LogOut, User } from 'lucide-react';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { constructions, isLoading, error, refresh } = useConstructions();
  const { user, logout } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('EM_ANDAMENTO');

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return constructions;
    return constructions.filter((c) => c.status === filterStatus);
  }, [constructions, filterStatus]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <MobileShell>
      <div className="px-4 py-6 min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
              <HardHat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
              <p className="text-sm text-muted-foreground">{user ? `Olá, ${user.name}` : APP_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/conta')} title="Minha conta">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
          Suas obras
        </h2>
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filterStatus === tab.key
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card/80 text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-3 mt-4">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          )}
          {filtered.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhuma obra com esse filtro
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default Dashboard;
