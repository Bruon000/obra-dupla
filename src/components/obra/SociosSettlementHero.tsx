import type { MemberStats } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';

type Transfer = { from: string; to: string; amount: number };

function buildTransfers(memberStats: MemberStats[]): Transfer[] {
  const balances = memberStats.map((s) => ({
    ...s,
    // Evita ruído de ponto flutuante em iterações de acerto.
    balance: Math.round(s.balance * 100) / 100,
  }));

  const receivers = balances
    .filter((s) => s.balance > 0)
    .map((s) => ({ ...s, remaining: s.balance }));

  const payers = balances
    .filter((s) => s.balance < 0)
    .map((s) => ({ ...s, remaining: Math.abs(s.balance) }));

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < payers.length && j < receivers.length) {
    const p = payers[i];
    const r = receivers[j];
    const amt = Math.min(p.remaining, r.remaining);

    if (amt > 0.009) {
      transfers.push({ from: p.name, to: r.name, amount: amt });
    }

    p.remaining -= amt;
    r.remaining -= amt;

    if (p.remaining <= 0.009) i++;
    if (r.remaining <= 0.009) j++;
  }

  return transfers;
}

export function SociosSettlementHero({
  memberStats,
  onConfigureMembers,
  className = '',
  canConfigureMembers = true,
}: {
  memberStats: MemberStats[];
  onConfigureMembers: () => void;
  className?: string;
  canConfigureMembers?: boolean;
}) {
  const totalRecebe = memberStats
    .filter((s) => s.finalSettlement > 0)
    .reduce((acc, s) => acc + s.finalSettlement, 0);

  const totalPaga = memberStats
    .filter((s) => s.finalSettlement < 0)
    .reduce((acc, s) => acc + Math.abs(s.finalSettlement), 0);

  const transfers = buildTransfers(memberStats);
  const primaryTransfer = transfers.length
    ? transfers.reduce((max, t) => (t.amount > max.amount ? t : max), transfers[0])
    : null;

  const hasTransfers = transfers.length > 0;

  return (
    <div
      className={[
        'relative rounded-[32px] ring-1 ring-border/45 shadow-card overflow-hidden bg-card/55',
        className,
      ].join(' ')}
    >
      {/* Superfície industrial + blueprint (sutil) */}
      <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_at_20%_18%,rgba(249,115,22,0.28),transparent_55%),radial-gradient(circle_at_82%_28%,rgba(59,130,246,0.22),transparent_52%)]" />

      <div className="relative p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground">
              Acerto entre sócios
            </p>
            <h3 className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight text-foreground/90">
              Acerto operacional em andamento
            </h3>

            {hasTransfers && primaryTransfer ? (
              <div className="mt-3">
                <div className="relative text-[26px] md:text-[30px] font-extrabold tracking-tight leading-[1.08]">
                  <span className="text-accent">{primaryTransfer.from}</span> paga{' '}
                  <span className="font-mono text-accent">{formatCurrency(primaryTransfer.amount)}</span> para{' '}
                  <span className="text-primary">{primaryTransfer.to}</span>
                </div>
                <div className="mt-2 h-px bg-gradient-to-r from-accent/70 via-border to-primary/60" />

                <div className="mt-3 flex items-center gap-3 text-[12px] md:text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-card/35 px-3 py-1 font-semibold">
                    Fluxo operacional
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="whitespace-nowrap">Recalcula automaticamente</span>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground/80 font-semibold">
                  Acerto de custos pagos vs. parte ideal (se alguém pagou mais/menos no rateio).
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm md:text-base text-muted-foreground font-semibold">
                Sem acerto pendente.
              </div>
            )}
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col gap-3 md:items-end">
            <Button
              variant="outline"
              size="lg"
              onClick={canConfigureMembers ? onConfigureMembers : undefined}
              disabled={!canConfigureMembers}
              className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
            >
              Configurar participação
            </Button>

            <div className="rounded-2xl ring-1 ring-border/30 bg-card/55 px-4 py-3 w-full md:min-w-[320px]">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground/90">Recebe</p>
                  <p className="mt-1 font-mono font-extrabold text-xl md:text-2xl text-primary leading-none break-words">
                    {formatCurrency(totalRecebe)}
                  </p>
                </div>

                <div className="relative hidden sm:flex items-center justify-center shrink-0">
                  <div className="h-[36px] w-px bg-border/40" />
                  <div className="absolute text-muted-foreground/70 font-extrabold">↔</div>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground/90">Paga</p>
                  <p className="mt-1 font-mono font-extrabold text-xl md:text-2xl text-accent leading-none break-words">
                    {formatCurrency(totalPaga)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 md:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8">
            <div className="relative rounded-2xl ring-1 ring-border/30 bg-card/40 px-4 py-3 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/60 via-border to-primary/60" />
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground/80">
                Fluxo operacional
              </p>
              {transfers.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Sem acerto pendente.</p>
              ) : (
                <div className="relative mt-3 space-y-2 opacity-95">
                  {transfers.slice(0, 2).map((t, idx) => {
                    const isPrimary =
                      !!primaryTransfer &&
                      t.from === primaryTransfer.from &&
                      t.to === primaryTransfer.to &&
                      t.amount === primaryTransfer.amount;

                    return (
                      <div
                        key={`${t.from}-${t.to}-${idx}`}
                        className={[
                          'relative flex items-center justify-between gap-4 rounded-xl px-3 py-2 overflow-hidden ring-1',
                          isPrimary ? 'ring-primary/20 bg-primary/5' : 'ring-border/15 bg-card/35',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'absolute inset-0 opacity-90',
                            isPrimary
                              ? 'bg-gradient-to-r from-accent/10 via-card/0 to-primary/15'
                              : 'bg-gradient-to-r from-card/0 via-card/0 to-card/0 opacity-0',
                          ].join(' ')}
                        />

                        <div className="relative flex items-center gap-3 min-w-0">
                          <span
                            className={[
                              'inline-flex h-2 w-2 rounded-full',
                              isPrimary ? 'bg-accent' : 'bg-border/70',
                            ].join(' ')}
                          />
                          <p className="text-sm font-extrabold text-foreground truncate">
                            {t.from} <span className="opacity-60">→</span> {t.to}
                          </p>
                        </div>

                        <span
                          className={[
                            'relative shrink-0 inline-flex items-center rounded-lg px-2 py-1 font-mono font-extrabold text-xs',
                            isPrimary ? 'bg-accent/12 text-accent' : 'bg-accent/10 text-accent',
                          ].join(' ')}
                        >
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}

                  {transfers.length > 2 ? (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      +{transfers.length - 2} fluxo(s) adicionais
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl ring-1 ring-border/30 bg-card/50 px-4 py-3 h-full">
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
                Resultado do fechamento (lucro + acerto)
              </p>
              <div className="mt-3 space-y-2 opacity-90">
                <div className="rounded-xl bg-primary/5 px-3 py-2 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-primary">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                      ↗
                    </span>
                    Recebe
                  </p>
                  <p className="font-mono font-extrabold text-sm text-primary">{formatCurrency(totalRecebe)}</p>
                </div>
                {totalPaga > 0 ? (
                  <div className="rounded-xl bg-accent/5 px-3 py-2 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-accent">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10">
                        ↘
                      </span>
                      Paga
                    </p>
                    <p className="font-mono font-extrabold text-sm text-accent">{formatCurrency(totalPaga)}</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-card/40 px-3 py-2 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-muted/30">
                        —
                      </span>
                      Paga
                    </p>
                    <p className="font-mono font-extrabold text-sm text-muted-foreground">R$ 0,00</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                Resultado final por sócio = lucro rateado + acerto operacional.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

