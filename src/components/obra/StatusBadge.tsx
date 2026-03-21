import type { ConstructionStatus } from '@/types';

const STATUS_MAP: Record<ConstructionStatus, { label: string; className: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-accent/15 text-accent border border-accent/30' },
  VENDIDA: { label: 'Vendida', className: 'bg-primary/15 text-primary border border-primary/30' },
  PAUSADA: { label: 'Pausada', className: 'bg-muted/40 text-muted-foreground border border-border' },
  ENTREGUE: { label: 'Entregue', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' },
};

export function StatusBadge({ status }: { status: ConstructionStatus }) {
  const config = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
