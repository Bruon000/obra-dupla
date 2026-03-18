import { formatDate } from '@/lib/formatters';
import { FileText, ShieldAlert, PlusCircle, PencilLine, Trash2 } from 'lucide-react';

export type AuditEntry = {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'gasto' | 'legal' | 'mao-de-obra' | 'venda' | 'obra';
  entityLabel: string;
  actorName?: string;
  at: string;
};

const actionLabel: Record<AuditEntry['action'], string> = {
  create: 'Criado',
  update: 'Editado',
  delete: 'Excluído',
};

const entityLabel: Record<AuditEntry['entityType'], string> = {
  'gasto': 'Gasto',
  'legal': 'Custo legal',
  'mao-de-obra': 'Mão de obra',
  'venda': 'Venda',
  'obra': 'Obra',
};

interface AuditLogListProps {
  entries: AuditEntry[];
}

export function AuditLogList({ entries }: AuditLogListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma alteração registrada</p>
        <p className="text-xs mt-1">Criar, editar ou excluir itens aparece aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        (() => {
          const isDenied = /^Tentativa negada:/i.test(String(entry.entityLabel ?? ""));
          const badgeText = isDenied ? "Negada" : actionLabel[entry.action];
          const badgeClass = isDenied
            ? "bg-destructive/15 text-destructive border border-destructive/25"
            : entry.action === 'create'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : entry.action === 'update'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20';

          const Icon =
            isDenied ? ShieldAlert : entry.action === 'create' ? PlusCircle : entry.action === 'update' ? PencilLine : Trash2;

          return (
            <div key={entry.id} className="flex gap-3 items-start">
              <div className="relative mt-1">
                {/* Linha do timeline */}
                <div className={`h-7 w-px bg-border/40`} />
                <div
                  className={[
                    "absolute left-[-6px] top-0 h-3 w-3 rounded-full ring-2",
                    isDenied ? "bg-destructive ring-destructive/25" : entry.action === 'create' ? "bg-primary ring-primary/25" : entry.action === 'update' ? "bg-amber-500 ring-amber-500/20" : "bg-destructive ring-destructive/25",
                  ].join(' ')}
                />
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-card/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className={`shrink-0 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {badgeText}
                  </span>
                </div>
                <p className="mt-2 font-medium text-sm truncate">
                  {entityLabel[entry.entityType]}: {entry.entityLabel}
                </p>
                {entry.actorName ? (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    por {entry.actorName}
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground mt-1">{formatDate(entry.at)}</p>
              </div>
            </div>
          );
        })()
      ))}
    </div>
  );
}
