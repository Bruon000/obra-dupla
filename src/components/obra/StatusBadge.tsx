import type { ConstructionStatus } from '@/types';

const STATUS_MAP: Record<ConstructionStatus, { label: string; className: string }> = {
  // Destaques: laranja/amarelo para execução; azul técnico para resultado.
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-accent/15 text-accent border border-accent/30' },
  VENDIDA: { label: 'Vendida', className: 'bg-primary/15 text-primary border border-primary/30' },
  PAUSADA: { label: 'Pausada', className: 'bg-muted/40 text-muted-foreground border border-border' },
};

export function StatusBadge({ status }: { status: ConstructionStatus }) {
  const config = STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
}
