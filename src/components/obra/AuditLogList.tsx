import { formatDate } from '@/lib/formatters';
import { FileText } from 'lucide-react';

export type AuditEntry = {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'gasto' | 'legal' | 'mao-de-obra' | 'venda' | 'obra';
  entityLabel: string;
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
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-xl p-3 border border-border bg-card text-sm"
        >
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            entry.action === 'create' ? 'bg-primary/15 text-primary' :
            entry.action === 'update' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
            'bg-destructive/15 text-destructive'
          }`}>
            {actionLabel[entry.action]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{entityLabel[entry.entityType]}: {entry.entityLabel}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(entry.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
