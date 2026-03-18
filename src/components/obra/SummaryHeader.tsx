import { formatCurrency } from '@/lib/formatters';
import type { ObraTotals } from '@/types';

interface SummaryHeaderProps {
  totals: ObraTotals;
  hasSale?: boolean;
  saleValue?: number;
}

export function SummaryHeader({ totals, hasSale, saleValue }: SummaryHeaderProps) {
  const showVgv = Boolean(hasSale && (saleValue ?? totals.grandTotal) > 0);

  const gridClass = showVgv ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="rounded-2xl border border-border bg-card/60 shadow-card p-2.5 overflow-hidden">
      <div className={`grid grid-cols-1 gap-2 ${gridClass}`}>
        <div className="relative rounded-xl border border-border bg-card/70 p-3 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/70 via-primary/30 to-accent/60" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground block">
            Investimento total
          </span>
          <span className="mt-1 block text-2xl font-mono font-extrabold tracking-tight">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>

        <div className="relative rounded-xl border border-border bg-card/70 p-3 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/90 via-primary/40 to-primary/10" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground block">
            Lucro após venda
          </span>
          <span className="mt-1 block text-2xl font-mono font-extrabold tracking-tight text-primary">
            {formatCurrency(totals.liquidProfit)}
          </span>
        </div>

        {showVgv && (
          <div className="relative rounded-xl border border-border bg-card/70 p-3 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/80 via-accent/30 to-primary/30" />
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground block">
              Receita / VGV
            </span>
            <span className="mt-1 block text-2xl font-mono font-extrabold tracking-tight text-accent">
              {formatCurrency(saleValue ?? 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
