import { formatCurrency, formatDate, formatTime } from '@/lib/formatters';
import type { Expense, ConstructionMember } from '@/types';
import { downloadAttachment } from '@/lib/attachments';
import { Receipt, Pencil, Trash2, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { ListPagination, LIST_PAGE_SIZE } from './ListPagination';
import { useState, useMemo, useEffect } from 'react';

interface ExpenseListProps {
  members: ConstructionMember[];
  expenses: Expense[];
  filterByUser?: string | null;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  canEdit?: (expense: Expense) => boolean;
  /** Agrupa por categoria com cabeçalho e total por categoria */
  groupByCategory?: boolean;
  /** ID do item a destacar (ex.: vindo da auditoria) */
  highlightedId?: string | null;
}

export function ExpenseList({ members, expenses, filterByUser, onEdit, onDelete, canEdit, groupByCategory, highlightedId }: ExpenseListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const filtered = filterByUser
    ? expenses.filter((e) => e.paidByUserId === filterByUser)
    : expenses;

  const byCategory = useMemo(() => {
    if (!groupByCategory) return null;
    const map = new Map<string, { total: number; items: Expense[] }>();
    for (const e of filtered) {
      const cat = e.category || 'Outros';
      const cur = map.get(cat);
      if (!cur) map.set(cat, { total: e.totalValue, items: [e] });
      else {
        cur.total += e.totalValue;
        cur.items.push(e);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [filtered, groupByCategory]);

  const flatList = useMemo(() => {
    if (byCategory) return byCategory.flatMap(([cat, { items }]) => items.map((e) => ({ expense: e, categoryName: cat })));
    return filtered.map((e) => ({ expense: e, categoryName: null as string | null }));
  }, [byCategory, filtered]);

  const totalPages = Math.max(1, Math.ceil(flatList.length / LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = flatList.slice((safePage - 1) * LIST_PAGE_SIZE, safePage * LIST_PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => {
    if (!highlightedId || flatList.length === 0) return;
    const idx = flatList.findIndex((p) => p.expense.id === highlightedId);
    if (idx >= 0) setPage(Math.floor(idx / LIST_PAGE_SIZE) + 1);
  }, [highlightedId, flatList]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum gasto registrado</p>
      </div>
    );
  }

  const renderExpense = (expense: Expense, categoryName?: string | null) => {
    const payer = members.find((m) => m.userId === expense.paidByUserId);
    const firstAttachment = expense.attachments?.[0] ?? null;
    const heroThumb =
      firstAttachment?.thumbnailBase64 && firstAttachment.mimeType?.startsWith("image/")
        ? `data:${firstAttachment.mimeType};base64,${firstAttachment.thumbnailBase64}`
        : null;
    const isHighlighted = highlightedId === expense.id;
    return (
      <div
        key={expense.id}
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
                <p className="font-medium text-sm truncate">{expense.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {categoryName ?? expense.category} · {formatDate(expense.createdAt ?? expense.date)}
                  {expense.weekLabel
                    ? ` · ${expense.weekLabel}`
                    : expense.createdAt
                      ? ` · ${formatTime(expense.createdAt)}`
                      : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  canEdit ? (canEdit(expense) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(expense)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(expense)} aria-label="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )
                )}
                {onDelete && (
                  canEdit ? (canEdit(expense) ? (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(expense)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : null) : (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(expense)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )
                )}
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(expense.totalValue)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                {payer?.name ?? 'N/A'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {expense.updatedAt && expense.createdAt && new Date(expense.updatedAt).getTime() > new Date(expense.createdAt).getTime() + 1000 && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">Editado</span>
                )}
                {expense.attachments && expense.attachments.length > 0 && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Com comprovante</span>
                )}
              </div>
              {expense.quantity > 1 && (
                <span className="text-[11px] text-muted-foreground">
                  {expense.quantity} × {formatCurrency(expense.unitValue)}
                </span>
              )}
            </div>
            {(expense.notes || expense.supplier || expense.invoiceNumber || expense.paymentMethod) && (
              <div className="mt-2 pt-2 border-t border-border space-y-0.5 text-[11px] text-muted-foreground">
                {expense.supplier && <p>Fornecedor: {expense.supplier}</p>}
                {expense.invoiceNumber && <p>Doc: {expense.invoiceNumber}</p>}
                {expense.paymentMethod && <p>Pagamento: {expense.paymentMethod}</p>}
                {expense.notes && <p>Obs: {expense.notes}</p>}
              </div>
            )}
            {expense.attachments && expense.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Comprovantes
                </p>
                <div className="flex flex-wrap gap-1">
                  {expense.attachments.map((a) => (
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
  };

  return (
    <div className="space-y-4">
      {byCategory ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 py-1.5 flex-wrap gap-2">
            {Array.from(new Set(paginated.map((p) => p.categoryName))).map((cat) => {
              const total = byCategory.find(([c]) => c === cat)?.[1].total ?? 0;
              return (
                <span key={cat} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {cat}: {formatCurrency(total)}
                </span>
              );
            })}
          </div>
          <div className="space-y-2">
            {paginated.map(({ expense, categoryName }) => renderExpense(expense, categoryName))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map(({ expense }) => renderExpense(expense, null))}
        </div>
      )}
      <ListPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={flatList.length}
        pageSize={LIST_PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="gastos"
      />
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
