import { MapPin, RefreshCcw } from 'lucide-react';
import { StatusBadge } from '@/components/obra/StatusBadge';
import type { Construction, ConstructionMember } from '@/types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

export function ObraHeroPanel({
  construction,
  members,
  onConfigureMembers,
  onNovoLancamento,
  kpis,
  canConfigureMembers = true,
}: {
  construction: Construction;
  members: ConstructionMember[];
  onConfigureMembers: () => void;
  onNovoLancamento: () => void;
  kpis: {
    grandTotal: number;
    totalMaterialCosts: number;
    totalServiceCosts: number;
    totalLaborCosts: number;
  };
  canConfigureMembers?: boolean;
}) {
  const participation = members.map((m) => `${m.name} ${m.sharePercent}%`).join(' · ');
  const hasAddress = Boolean(construction.address && construction.address.trim().length > 0);

  const end = construction.endDate ? new Date(`${construction.endDate}T00:00:00`) : null;
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysToDelivery = end ? Math.floor((end.getTime() - todayDateOnly.getTime()) / 86400000) : null;
  const deliveryState =
    end == null
      ? { label: 'Sem previsão de entrega', tone: 'muted' as const }
      : daysToDelivery != null && daysToDelivery < 0
        ? { label: `Atrasada (${Math.abs(daysToDelivery)}d)`, tone: 'accent' as const }
        : daysToDelivery === 0
          ? { label: 'Pronta pra entrega', tone: 'primary' as const }
          : { label: `Em dia (faltam ${daysToDelivery}d)`, tone: 'primary' as const };

  return (
    <div className="relative rounded-3xl border border-border/55 bg-card/70 shadow-card overflow-hidden">
      {/* Textura industrial (concreto/blueprint) bem sutil */}
      <div className="absolute inset-0 opacity-[0.20] bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_at_22%_18%,rgba(249,115,22,0.22),transparent_55%),radial-gradient(circle_at_82%_24%,rgba(59,130,246,0.18),transparent_52%)]" />

      <div className="relative p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <div className="relative min-w-0">
                <h1 className="text-[30px] md:text-4xl font-black tracking-tight leading-[1.05] break-words">
                  {construction.title}
                </h1>
                <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-[0.5px] bg-gradient-to-r from-primary/70 via-border/60 to-accent/50" />
              </div>
              <div className="shrink-0 self-start sm:self-auto">
                <StatusBadge status={construction.status} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground font-semibold">
              {hasAddress ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-card/45 px-3 py-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[220px] md:max-w-[420px]">{construction.address}</span>
                </span>
              ) : null}

              <span className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-card/45 px-3 py-1">
                <span className="opacity-80">Participação</span>
                <span className="opacity-40">•</span>
                <span className="truncate max-w-[260px] md:max-w-[560px]">
                  {participation}
                </span>
              </span>
            </div>

            <div className="mt-3">
              <span
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider',
                  deliveryState.tone === 'primary'
                    ? 'border-primary/25 bg-primary/10 text-primary'
                    : deliveryState.tone === 'accent'
                      ? 'border-accent/25 bg-accent/10 text-accent'
                      : 'border-border/25 bg-card/45 text-muted-foreground',
                ].join(' ')}
              >
                Entrega: {deliveryState.label}
              </span>
            </div>

            {/* Só dados da obra: isso dá altura sem trazer valores financeiros */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border/35 bg-card/45 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground/90">
                  Início
                </div>
                <div className="mt-1 font-mono font-extrabold text-sm text-foreground/90">
                  {(construction.startDate ?? '').slice(0, 10).replace(/-/g, '/') || '—'}
                </div>
              </div>
              <div className="rounded-2xl border border-border/35 bg-card/45 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground/90">
                  Término
                </div>
                <div className="mt-1 font-mono font-extrabold text-sm text-foreground/90">
                  {(construction.endDate ?? '').slice(0, 10).replace(/-/g, '/') || '—'}
                </div>
              </div>
            </div>
          </div>

            <div className="shrink-0 hidden md:flex flex-col items-stretch gap-2 rounded-3xl border border-border/40 bg-card/55 px-3 py-3 min-w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
                  Operação
                </div>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-border via-border/60 to-transparent" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={canConfigureMembers ? onConfigureMembers : undefined}
              disabled={!canConfigureMembers}
              className="w-full justify-center"
            >
              Configurar participação
            </Button>
            <Button
              size="sm"
              onClick={onNovoLancamento}
              className="w-full justify-center bg-accent/10 text-accent hover:bg-accent/20 border border-accent/10"
            >
              Novo lançamento
            </Button>

            <div className="mt-auto pt-1 text-[10px] text-muted-foreground/90 font-bold uppercase tracking-widest inline-flex items-center gap-1.5 justify-center">
              <RefreshCcw className="w-3.5 h-3.5" />
              Atualização automática
            </div>
          </div>
        </div>

        <div className="mt-4 flex md:hidden items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onConfigureMembers}>
            Configurar
          </Button>
          <Button size="sm" onClick={onNovoLancamento}>
            Novo
          </Button>
        </div>
      </div>
    </div>
  );
}

