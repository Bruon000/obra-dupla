import { formatDateTime } from '@/lib/formatters';
import { FileText, ShieldAlert, PlusCircle, PencilLine, Trash2 } from 'lucide-react';
import { ListPagination, LIST_PAGE_SIZE } from './ListPagination';
import { useState, useMemo, useEffect } from 'react';

export type AuditEntry = {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'gasto' | 'legal' | 'mao-de-obra' | 'venda' | 'obra';
  entityLabel: string;
  /** ID do item alvo (ex.: jobCostEntry id) quando existir */
  targetId?: string;
  actorName?: string;
  /** ID do usuário que fez a ação (para filtrar notificações "o outro sócio fez") */
  actorId?: string;
  at: string;
  /** Quando true, exibe etiqueta "Com comprovante" abaixo do texto em vez de mencionar no label */
  isAttachmentEvent?: boolean;
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
  /** Lista mais densa (resumo na tela inicial) */
  compact?: boolean;
  /** Itens por página (para não estourar a altura do card) */
  pageSize?: number;
  onEntryClick?: (entry: AuditEntry) => void;
  /** Quando informado, itens com at > lastSeenAt são destacados como "não lidos" (ex.: painel de notificações) */
  lastSeenAt?: string | null;
}

export function AuditLogList({ entries, compact, pageSize, onEntryClick, lastSeenAt }: AuditLogListProps) {
  const [page, setPage] = useState(1);
  const effectivePageSize = pageSize ?? LIST_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(entries.length / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      entries.slice(
        (safePage - 1) * effectivePageSize,
        safePage * effectivePageSize
      ),
    [entries, safePage, effectivePageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  if (entries.length === 0) {
    return (
      <div className={`text-center text-muted-foreground ${compact ? 'py-6' : 'py-12'}`}>
        <FileText className={`mx-auto mb-2 opacity-50 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`} />
        <p className={compact ? 'text-xs' : 'text-sm'}>Nenhuma alteração registrada</p>
        {!compact && <p className="text-xs mt-1">Criar, editar ou excluir itens aparece aqui</p>}
      </div>
    );
  }

  const spaceClass = compact ? 'space-y-1.5' : 'space-y-2';
  const lineH = compact ? 'h-5' : 'h-7';
  const dotSize = compact ? 'h-2.5 w-2.5 left-[-5px]' : 'h-3 w-3 left-[-6px]';
  const cardPad = compact ? 'p-2' : 'p-3';
  const labelSize = compact ? 'text-xs' : 'text-sm';
  const metaSize = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className={spaceClass}>
      {paginated.map((entry) => (
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

          const clickable = Boolean(onEntryClick);
          const isUnread = Boolean(
            lastSeenAt != null &&
            entry.at &&
            new Date(entry.at).getTime() > new Date(lastSeenAt).getTime()
          );
          return (
            <div
              key={entry.id}
              className={`flex gap-2 items-start ${clickable ? 'cursor-pointer hover:opacity-95' : ''}`}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onEntryClick?.(entry) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onEntryClick?.(entry);
                    }
                  : undefined
              }
            >
              <div className="relative mt-0.5">
                <div className={`${lineH} w-px bg-border/40`} />
                <div
                  className={[
                    `absolute top-0 rounded-full ring-2 ${dotSize}`,
                    isDenied ? "bg-destructive ring-destructive/25" : entry.action === 'create' ? "bg-primary ring-primary/25" : entry.action === 'update' ? "bg-amber-500 ring-amber-500/20" : "bg-destructive ring-destructive/25",
                  ].join(' ')}
                />
              </div>
              <div
                className={`min-w-0 flex-1 rounded-lg border ${cardPad} ${
                  isUnread
                    ? 'border-l-4 border-l-primary bg-primary/10 border-border/40'
                    : 'border border-border/40 bg-card/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeClass}`}>
                    <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                    {badgeText}
                  </span>
                </div>
                <p className={`mt-1.5 font-medium truncate ${labelSize}`}>
                  {entityLabel[entry.entityType]}: {entry.entityLabel}
                </p>
                {entry.isAttachmentEvent && (
                  <p className="mt-1">
                    <span className="inline-flex text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Com comprovante
                    </span>
                  </p>
                )}
                {entry.actorName ? (
                  <p className={`${metaSize} text-muted-foreground mt-0.5 truncate`}>
                    por {entry.actorName}
                  </p>
                ) : null}
                <p className={`${metaSize} text-muted-foreground mt-0.5`}>{formatDateTime(entry.at)}</p>
              </div>
            </div>
          );
        })()
      ))}
      <ListPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={entries.length}
        pageSize={effectivePageSize}
        onPageChange={setPage}
        itemLabel="alterações"
      />
    </div>
  );
}
