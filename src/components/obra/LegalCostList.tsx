import { formatCurrency, formatDate } from '@/lib/formatters';
import type { LegalCost } from '@/types';
import { MEMBERS } from '@/lib/mock-data';
import { Gavel } from 'lucide-react';

interface LegalCostListProps {
  costs: LegalCost[];
}

export function LegalCostList({ costs }: LegalCostListProps) {
  if (costs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum custo legal registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {costs.map((cost) => {
        const payer = MEMBERS.find((m) => m.userId === cost.paidByUserId);
        return (
          <div key={cost.id} className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cost.description}</p>
                <p className="text-[11px] text-muted-foreground">{cost.type} · {formatDate(cost.date)}</p>
              </div>
              <span className="font-mono font-bold text-sm ml-2">{formatCurrency(cost.value)}</span>
            </div>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground mt-1">
              {payer?.name ?? 'N/A'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
