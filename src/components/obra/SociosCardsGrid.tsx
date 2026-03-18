import type { MemberStats } from '@/types';
import { MemberContributionCard } from './MemberContributionCard';

export function SociosCardsGrid({ memberStats }: { memberStats: MemberStats[] }) {
  return (
    <div className="relative rounded-3xl border border-border/55 bg-card/60 shadow-card p-3 md:p-4 overflow-hidden">
      {/* Micro-textura para dar materialidade */}
      <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/50 via-border to-primary/50" />

      <div className="relative flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-muted-foreground">
            Sócios • Fechamento
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total pago, saldo e lucro final por participação.
          </p>
        </div>
        <div className="hidden sm:block mt-0.5">
          <div className="rounded-full border border-border/35 bg-card/35 px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
            {memberStats.length} fichas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {memberStats.map((stat) => (
          <MemberContributionCard key={stat.userId} stat={stat} />
        ))}
      </div>
    </div>
  );
}

