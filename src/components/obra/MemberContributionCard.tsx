import { formatCurrency } from '@/lib/formatters';
import type { MemberStats } from '@/types';

interface MemberContributionCardProps {
  stat: MemberStats;
}

export function MemberContributionCard({ stat }: MemberContributionCardProps) {
  const isPositiveBalance = stat.balance >= 0;

  return (
    <div className="bg-card rounded-xl p-3 shadow-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm">
            {stat.name[0]}
          </div>
          <div>
            <span className="font-extrabold text-sm">{stat.name}</span>
            <span className="text-[10px] text-muted-foreground ml-1">({stat.sharePercent}%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block">Total pago</span>
          <span className="font-mono font-extrabold">{formatCurrency(stat.totalPaid)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block">Parte ideal</span>
          <span className="font-mono font-extrabold">{formatCurrency(stat.idealContribution)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block">Saldo</span>
          <span className={`font-mono font-extrabold ${isPositiveBalance ? 'text-primary' : 'text-destructive'}`}>
            {isPositiveBalance ? '+' : ''}{formatCurrency(stat.balance)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block">Lucro</span>
          <span className="font-mono font-extrabold text-primary">{formatCurrency(stat.profitShare)}</span>
        </div>
      </div>

      {stat.finalSettlement !== 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block">Acerto final</span>
          <span className={`font-mono font-extrabold text-base ${stat.finalSettlement > 0 ? 'text-primary' : 'text-destructive'}`}>
            {stat.finalSettlement > 0 ? 'Recebe ' : 'Paga '}
            {formatCurrency(Math.abs(stat.finalSettlement))}
          </span>
        </div>
      )}
    </div>
  );
}
