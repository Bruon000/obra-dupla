import { useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HardHat className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ObraDupla</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controle de obras entre sócios
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-base font-bold"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Ir para o app' : 'Entrar'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Gerencie gastos, mão de obra e lucros da sua construção
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
