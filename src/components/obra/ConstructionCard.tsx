import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import type { Construction } from '@/types';

interface ConstructionCardProps {
  construction: Construction;
}

export function ConstructionCard({ construction }: ConstructionCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/obras/${construction.id}`)}
      className="w-full bg-card/90 hover:bg-card rounded-xl p-3.5 shadow-sm border border-border text-left transition-all hover:border-primary/30 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-extrabold text-[15px] leading-5 truncate">{construction.title}</h3>
            <StatusBadge status={construction.status} />
          </div>
          {construction.address && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{construction.address}</span>
            </div>
          )}
          {construction.saleValue > 0 && (
            <span className="text-xs font-mono font-extrabold text-primary">
              {formatCurrency(construction.saleValue)}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}
