import { formatCurrency, formatDate } from '@/lib/formatters';
import type { LegalCost, ConstructionMember } from '@/types';
import { Gavel, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalCostListProps {
  members: ConstructionMember[];
  costs: LegalCost[];
  onEdit?: (cost: LegalCost) => void;
  onDelete?: (cost: LegalCost) => void;
}

export function LegalCostList({ members, costs, onEdit, onDelete }: LegalCostListProps) {
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
        const payer = members.find((m) => m.userId === cost.paidByUserId);
        return (
          <div key={cost.id} className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cost.description}</p>
                <p className="text-[11px] text-muted-foreground">{cost.type} · {formatDate(cost.date)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cost)} aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(cost)} aria-label="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <span className="font-mono font-bold text-sm">{formatCurrency(cost.value)}</span>
              </div>
            </div>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground mt-1">
              {payer?.name ?? 'N/A'}
            </span>
            {cost.notes && (
              <p className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">Obs: {cost.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
