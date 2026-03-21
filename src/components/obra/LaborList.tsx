import { formatCurrency, formatDate } from '@/lib/formatters';
import type { LaborEntry, ConstructionMember } from '@/types';
import { Hammer, Pencil, Trash2, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadAttachment } from '@/lib/attachments';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { ListPagination, LIST_PAGE_SIZE } from './ListPagination';
import { useState, useMemo, useEffect } from 'react';

interface LaborListProps {
  members: ConstructionMember[];
  entries: LaborEntry[];
  onEdit?: (entry: LaborEntry) => void;
  onDelete?: (entry: LaborEntry) => void;
  canEdit?: (entry: LaborEntry) => boolean;
  /** ID do item a destacar (ex.: vindo da auditoria) */
  highlightedId?: string | null;
}

export function LaborList({ members, entries, onEdit, onDelete, canEdit, highlightedId }: LaborListProps) {
  const isImage = (mimeType: string | undefined) => !!mimeType && mimeType.startsWith("image/");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => entries.slice((safePage - 1) * LIST_PAGE_SIZE, safePage * LIST_PAGE_SIZE),
    [entries, safePage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => {
    if (!highlightedId || entries.length === 0) return;
    const idx = entries.findIndex((e) => e.id === highlightedId);
    if (idx >= 0) setPage(Math.floor(idx / LIST_PAGE_SIZE) + 1);
  }, [highlightedId, entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Hammer className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma mão de obra registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paginated.map((entry) => {
        const payer = members.find((m) => m.userId === entry.paidByUserId);
        const firstAttachment = entry.attachments?.[0] ?? null;
        const heroThumb =
          firstAttachment?.thumbnailBase64 && isImage(firstAttachment.mimeType)
            ? `data:${firstAttachment.mimeType};base64,${firstAttachment.thumbnailBase64}`
            : null;
        const isHighlighted = highlightedId === entry.id;
        return (
          <div
            key={entry.id}
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
                <p className="font-medium text-sm truncate">{entry.service}</p>
                <p className="text-[11px] text-muted-foreground">{entry.weekLabel} · {entry.startDate} a {entry.endDate}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  canEdit ? (canEdit(entry) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )
                )}
                {onDelete && (
                  canEdit ? (canEdit(entry) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(entry)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(entry)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )
                )}
                <span className="font-mono font-bold text-sm">{formatCurrency(entry.value)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                {payer?.name ?? 'N/A'}
              </span>
              {entry.updatedAt && entry.createdAt && new Date(entry.updatedAt).getTime() > new Date(entry.createdAt).getTime() + 1000 && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Editado</span>
              )}
              {entry.attachments && entry.attachments.length > 0 && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Com comprovante</span>
              )}
            </div>
            {entry.notes && (
              <p className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">Obs: {entry.notes}</p>
            )}
            {entry.attachments && entry.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Comprovantes
                </p>
                <div className="flex flex-wrap gap-1">
                  {entry.attachments.map((a) => (
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
        totalItems={entries.length}
        pageSize={LIST_PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="lançamentos"
      />
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
