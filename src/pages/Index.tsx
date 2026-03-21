import { useNavigate } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <HardHat className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{APP_NAME}</h1>
            <p className="text-muted-foreground text-sm mt-2">
              {APP_TAGLINE}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-base font-bold rounded-xl shadow-lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Ir para o app' : 'Entrar'}
          </Button>
          {!isAuthenticated && (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={() => navigate('/cadastro')}
            >
              Criar conta
            </Button>
          )}
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
            Gerencie gastos, mão de obra e lucros da sua construção
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
