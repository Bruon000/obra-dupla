import { formatCurrency } from '@/lib/formatters';
import type { ObraTotals } from '@/types';

interface SummaryHeaderProps {
  totals: ObraTotals;
  hasSale?: boolean;
}

export function SummaryHeader({ totals, hasSale }: SummaryHeaderProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="grid grid-cols-2 gap-0">
        <div className="p-3 border-r border-border">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
          Investimento total
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-mono font-extrabold tracking-tight">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
        <div className="p-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">
          {hasSale ? 'Lucro líquido' : 'Lucro (após venda)'}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-mono font-extrabold tracking-tight text-primary">
              {formatCurrency(totals.liquidProfit)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary/80 via-primary/30 to-accent/70" />
    </div>
  );
}
