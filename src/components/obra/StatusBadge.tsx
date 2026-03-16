import type { ConstructionStatus } from '@/types';

const STATUS_MAP: Record<ConstructionStatus, { label: string; className: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-amber-light text-accent' },
  VENDIDA: { label: 'Vendida', className: 'bg-emerald-light text-primary' },
  PAUSADA: { label: 'Pausada', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status }: { status: ConstructionStatus }) {
  const config = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
