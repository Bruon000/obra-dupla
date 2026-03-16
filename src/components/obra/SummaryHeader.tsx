import { formatCurrency } from '@/lib/formatters';
import type { ObraTotals } from '@/types';

interface SummaryHeaderProps {
  totals: ObraTotals;
}

export function SummaryHeader({ totals }: SummaryHeaderProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-foreground text-background rounded-2xl shadow-card">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Investimento Total
        </span>
        <span className="text-xl font-mono font-bold tracking-tight">
          {formatCurrency(totals.grandTotal)}
        </span>
      </div>
      <div className="flex flex-col border-l border-muted-foreground/20 pl-4">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Lucro Líquido
        </span>
        <span className="text-xl font-mono font-bold tracking-tight text-primary">
          {formatCurrency(totals.liquidProfit)}
        </span>
      </div>
    </div>
  );
}
