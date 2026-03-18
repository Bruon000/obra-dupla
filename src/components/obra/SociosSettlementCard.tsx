import { formatCurrency } from '@/lib/formatters';
import type { MemberStats } from '@/types';

type Transfer = { from: string; to: string; amount: number };

function buildTransfers(memberStats: MemberStats[]): Transfer[] {
  const balances = memberStats.map((s) => ({
    ...s,
    // Evita ruído de ponto flutuante em iterações de acerto.
    balance: Math.round(s.balance * 100) / 100,
    remaining: 0 as number,
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

export function SociosSettlementCard({ memberStats }: { memberStats: MemberStats[] }) {
  const transfers = buildTransfers(memberStats);

  const balances = memberStats.map((s) => ({
    ...s,
    balance: Math.round(s.balance * 100) / 100,
  }));
  const receiversCount = balances.filter((s) => s.balance > 0).length;
  const payersCount = balances.filter((s) => s.balance < 0).length;

  return (
    <div className="rounded-2xl border border-border bg-card/60 shadow-card overflow-hidden">
      <div className="p-3 border-b border-border bg-gradient-to-r from-accent/20 via-card/0 to-primary/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">
              Acerto entre sócios
            </p>
            <p className="text-sm font-extrabold text-foreground mt-1">
              {receiversCount + payersCount > 0 ? (
                <>
                  Ajustes operacionais · {payersCount} paga{payersCount === 1 ? '' : 'm'} · {receiversCount}{' '}
                  recebe{receiversCount === 1 ? '' : 'm'}
                </>
              ) : (
                'Sem acerto pendente'
              )}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-border bg-card/60 px-2 py-1">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
              Transações
            </span>
            <div className="mt-1 font-mono font-extrabold text-lg">{transfers.length}</div>
          </div>
        </div>
      </div>

      <div className="p-3">
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem acerto pendente.</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, idx) => (
              <div
                key={`${t.from}-${t.to}-${idx}`}
                className="rounded-xl border border-border bg-card/50 px-3 py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-foreground truncate">
                    {t.from} paga {formatCurrency(t.amount)} para {t.to}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-lg bg-accent/10 border border-accent/20 px-2 py-1 font-mono font-extrabold text-accent">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3">
          Dica: saldo &gt; 0 recebe e saldo &lt; 0 paga (valor absoluto). Mantemos o acerto consistente via rateio por saldo.
        </p>
      </div>
    </div>
  );
}

