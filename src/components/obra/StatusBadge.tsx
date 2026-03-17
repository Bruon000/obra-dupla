import type { ConstructionStatus } from '@/types';

const STATUS_MAP: Record<ConstructionStatus, { label: string; className: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-amber-light text-accent border border-accent/20' },
  VENDIDA: { label: 'Vendida', className: 'bg-primary/10 text-primary border border-primary/20' },
  PAUSADA: { label: 'Pausada', className: 'bg-muted text-muted-foreground border border-border' },
};

export function StatusBadge({ status }: { status: ConstructionStatus }) {
  const config = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
