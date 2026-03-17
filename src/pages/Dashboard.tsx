import { useNavigate } from 'react-router-dom';
import { MobileShell } from '@/components/layout/MobileShell';
import { ConstructionCard } from '@/components/obra/ConstructionCard';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { HardHat, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const navigate = useNavigate();
  const { constructions, isLoading, error, refresh } = useConstructions();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <MobileShell>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ObraDupla</h1>
              <p className="text-sm text-muted-foreground">{user ? `Olá, ${user.name}` : 'Gestão de obras entre sócios'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="shrink-0">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
          Suas obras
        </h2>
        {error && (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
          )}
          {constructions.map((c) => (
            <ConstructionCard key={c.id} construction={c} />
          ))}
        </div>
      </div>
    </MobileShell>
  );
};

export default Dashboard;
