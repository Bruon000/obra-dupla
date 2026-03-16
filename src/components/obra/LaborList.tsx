import { formatCurrency } from '@/lib/formatters';
import type { LaborEntry } from '@/types';
import { MEMBERS } from '@/lib/mock-data';
import { Hammer } from 'lucide-react';

interface LaborListProps {
  entries: LaborEntry[];
}

export function LaborList({ entries }: LaborListProps) {
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
        const payer = MEMBERS.find((m) => m.userId === entry.paidByUserId);
        return (
          <div key={entry.id} className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.service}</p>
                <p className="text-[11px] text-muted-foreground">{entry.weekLabel} · {entry.startDate} a {entry.endDate}</p>
              </div>
              <span className="font-mono font-bold text-sm ml-2">{formatCurrency(entry.value)}</span>
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
