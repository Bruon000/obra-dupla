import { formatCurrency } from '@/lib/formatters';
import type { LaborEntry, ConstructionMember } from '@/types';
import { Hammer, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LaborListProps {
  members: ConstructionMember[];
  entries: LaborEntry[];
  onEdit?: (entry: LaborEntry) => void;
  onDelete?: (entry: LaborEntry) => void;
}

export function LaborList({ members, entries, onEdit, onDelete }: LaborListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Hammer className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma mão de obra registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const payer = members.find((m) => m.userId === entry.paidByUserId);
        return (
          <div key={entry.id} className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.service}</p>
                <p className="text-[11px] text-muted-foreground">{entry.weekLabel} · {entry.startDate} a {entry.endDate}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)} aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(entry)} aria-label="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <span className="font-mono font-bold text-sm">{formatCurrency(entry.value)}</span>
              </div>
            </div>
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground mt-1">
              {payer?.name ?? 'N/A'}
            </span>
            {entry.notes && (
              <p className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">Obs: {entry.notes}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
