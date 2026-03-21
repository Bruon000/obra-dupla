import { formatCurrency, formatDate } from '@/lib/formatters';
import type { LegalCost, ConstructionMember } from '@/types';
import { Gavel, Pencil, Trash2, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadAttachment } from '@/lib/attachments';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { ListPagination, LIST_PAGE_SIZE } from './ListPagination';
import { useState, useMemo, useEffect } from 'react';

interface LegalCostListProps {
  members: ConstructionMember[];
  costs: LegalCost[];
  onEdit?: (cost: LegalCost) => void;
  onDelete?: (cost: LegalCost) => void;
  canEdit?: (cost: LegalCost) => boolean;
  /** ID do item a destacar (ex.: vindo da auditoria) */
  highlightedId?: string | null;
}

export function LegalCostList({ members, costs, onEdit, onDelete, canEdit, highlightedId }: LegalCostListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(costs.length / LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => costs.slice((safePage - 1) * LIST_PAGE_SIZE, safePage * LIST_PAGE_SIZE),
    [costs, safePage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => {
    if (!highlightedId || costs.length === 0) return;
    const idx = costs.findIndex((c) => c.id === highlightedId);
    if (idx >= 0) setPage(Math.floor(idx / LIST_PAGE_SIZE) + 1);
  }, [highlightedId, costs]);

  if (costs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum custo legal registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paginated.map((cost) => {
        const payer = members.find((m) => m.userId === cost.paidByUserId);
        const firstAttachment = cost.attachments?.[0] ?? null;
        const heroThumb =
          firstAttachment?.thumbnailBase64 && firstAttachment.mimeType?.startsWith("image/")
            ? `data:${firstAttachment.mimeType};base64,${firstAttachment.thumbnailBase64}`
            : null;
        const isHighlighted = highlightedId === cost.id;
        return (
          <div
            key={cost.id}
            className={`relative rounded-3xl p-4 shadow-sm border animate-slide-up overflow-hidden ${isHighlighted ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'bg-card/60 border-border/50'}`}
          >
            {heroThumb ? (
              <div className="absolute inset-0 opacity-25">
                <img src={heroThumb} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-card/70 via-card/10 to-background/90" />
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cost.description}</p>
                <p className="text-[11px] text-muted-foreground">{cost.type} · {formatDate(cost.date)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  canEdit ? (canEdit(cost) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cost)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cost)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )
                )}
                {onDelete && (
                  canEdit ? (canEdit(cost) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(cost)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(cost)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )
                )}
                <span className="font-mono font-bold text-sm">{formatCurrency(cost.value)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                {payer?.name ?? 'N/A'}
              </span>
              {cost.updatedAt && cost.createdAt && new Date(cost.updatedAt).getTime() > new Date(cost.createdAt).getTime() + 1000 && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Editado</span>
              )}
              {cost.attachments && cost.attachments.length > 0 && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Com comprovante</span>
              )}
            </div>
            {cost.notes && (
              <p className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">Obs: {cost.notes}</p>
            )}
            {cost.attachments && cost.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Comprovantes
                </p>
                <div className="flex flex-wrap gap-1">
                  {cost.attachments.map((a) => (
                    <div key={a.id} className="border border-border/60 bg-background/50 rounded-lg px-2 py-1 flex items-start gap-2 min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewAttachment(a);
                          setPreviewOpen(true);
                        }}
                        className="text-[11px] font-medium text-primary hover:underline text-left flex-1"
                        aria-label={`Abrir ${a.fileName}`}
                      >
                        {a.fileName}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAttachment(a)}
                        className="shrink-0 p-1 rounded hover:bg-secondary/60"
                        aria-label={`Baixar ${a.fileName}`}
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <div className="flex-1 min-w-0">
                        {a.createdByUser?.name ? (
                          <div className="text-[10px] text-muted-foreground truncate">Enviado por {a.createdByUser.name}</div>
                        ) : null}
                        {a.createdAt ? (
                          <div className="text-[10px] text-muted-foreground truncate">Data: {formatDate(a.createdAt)}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <ListPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={costs.length}
        pageSize={LIST_PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="custos legais"
      />
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
