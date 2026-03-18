import { formatCurrency } from '@/lib/formatters';
import type { MemberStats } from '@/types';

interface MemberContributionCardProps {
  stat: MemberStats;
}

export function MemberContributionCard({ stat }: MemberContributionCardProps) {
  const isPositiveBalance = stat.balance >= 0;
  const isReceiveFinal = stat.finalSettlement >= 0;
  const isNeutralFinal = stat.finalSettlement === 0;

  const initials = (() => {
    const parts = stat.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  return (
    <div className="relative bg-card/60 rounded-3xl p-4 shadow-card border border-border/50 overflow-hidden">
      <div
        className={[
          'absolute inset-x-0 top-0 h-[3px]',
          isNeutralFinal ? 'bg-border/80' : isReceiveFinal ? 'bg-primary/60' : 'bg-accent/60',
        ].join(' ')}
      />

      {/* Textura industrial bem sutil */}
      <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={[
                'w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0',
                isNeutralFinal ? 'bg-muted/30 text-muted-foreground' : isReceiveFinal ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent',
              ].join(' ')}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-base truncate">{stat.name}</span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground whitespace-nowrap rounded-full bg-card/60 px-2 py-0.5">
                  {stat.sharePercent}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-widest font-extrabold">
                participação
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block truncate">
              Total pago
            </span>
            <span className="font-mono font-extrabold text-sm">{formatCurrency(stat.totalPaid)}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block truncate">
              Parte ideal
            </span>
            <span className="font-mono font-extrabold text-sm">{formatCurrency(stat.idealContribution)}</span>
          </div>
        </div>

        <div
          className={[
            'mt-2 rounded-2xl px-3 py-3 ring-1',
            isPositiveBalance ? 'ring-primary/25 bg-primary/10' : 'ring-accent/25 bg-accent/10',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/90 font-extrabold">
              Saldo
            </span>
            <span
              className={[
                'inline-flex items-center rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest font-extrabold',
                isPositiveBalance ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent',
              ].join(' ')}
            >
              {isPositiveBalance ? 'Recebe' : 'Paga'}
            </span>
          </div>

          <div className={`mt-2 font-mono font-extrabold text-xl ${isPositiveBalance ? 'text-primary' : 'text-accent'}`}>
            {formatCurrency(Math.abs(stat.balance))}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
            saldo no rateio
          </div>
        </div>

        <div className="mt-2 rounded-2xl ring-1 ring-border/20 bg-card/45 px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold block truncate">
              Lucro
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 block mt-0.5">
              rateio final
            </span>
          </div>
          <div
            className={`shrink-0 font-mono font-extrabold text-sm ${stat.profitShare >= 0 ? 'text-primary' : 'text-accent'}`}
          >
            {formatCurrency(stat.profitShare)}
          </div>
        </div>

        <div
          className={[
            'mt-3 rounded-2xl px-3 py-3 flex items-center justify-between gap-3 relative overflow-hidden ring-1',
            'bg-gradient-to-br from-card/40 via-card/10 to-card/0',
            isNeutralFinal
              ? 'ring-border/35'
              : isReceiveFinal
                ? 'ring-primary/30'
                : 'ring-accent/30',
          ].join(' ')}
        >
          <div
            className={[
              'absolute inset-0 opacity-70',
              isNeutralFinal
                ? 'bg-gradient-to-br from-card/45 via-card/10 to-card/0'
                : isReceiveFinal
                  ? 'bg-gradient-to-br from-primary/10 via-card/10 to-card/0'
                  : 'bg-gradient-to-br from-accent/10 via-card/10 to-card/0',
            ].join(' ')}
          />

          <div
            className={[
              'absolute left-0 top-0 bottom-0 w-[3px]',
              isNeutralFinal ? 'bg-border/80' : isReceiveFinal ? 'bg-primary/55' : 'bg-accent/55',
            ].join(' ')}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  'inline-flex rounded-xl px-2 py-1 text-[10px] uppercase tracking-widest font-extrabold',
                  isNeutralFinal
                    ? 'bg-card/40 text-muted-foreground'
                    : isReceiveFinal
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/10 text-accent',
                ].join(' ')}
              >
                {isNeutralFinal ? 'Empatado' : stat.finalSettlement > 0 ? 'Recebe' : 'Paga'}
              </span>
            </div>

            <span className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground block mt-2">
              resultado final
            </span>
          </div>

          <div className="relative shrink-0 text-right">
            <div
              className={[
                'font-mono font-extrabold',
                isNeutralFinal ? 'text-foreground' : isReceiveFinal ? 'text-primary' : 'text-accent',
                'text-xl md:text-2xl',
              ].join(' ')}
            >
              {formatCurrency(Math.abs(stat.finalSettlement))}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 mt-1">
              saldo no fechamento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
