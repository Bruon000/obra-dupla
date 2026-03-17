import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, HardHat, Plus, Users } from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
  { icon: HardHat, label: 'Obras', path: '/obras' },
  { icon: Users, label: 'Usuários', path: '/usuarios' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => navigate('/obras/nova')}
          className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-primary-foreground shadow-card"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
