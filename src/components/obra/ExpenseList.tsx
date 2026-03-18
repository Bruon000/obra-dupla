import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Expense, ConstructionMember } from '@/types';
import { downloadAttachment } from '@/lib/attachments';
import { Receipt, Pencil, Trash2, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { useState } from 'react';

interface ExpenseListProps {
  members: ConstructionMember[];
  expenses: Expense[];
  filterByUser?: string | null;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  canEdit?: (expense: Expense) => boolean;
}

export function ExpenseList({ members, expenses, filterByUser, onEdit, onDelete, canEdit }: ExpenseListProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

  const filtered = filterByUser
    ? expenses.filter((e) => e.paidByUserId === filterByUser)
    : expenses;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum gasto registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((expense) => {
        const payer = members.find((m) => m.userId === expense.paidByUserId);
        const firstAttachment = expense.attachments?.[0] ?? null;
        const heroThumb =
          firstAttachment?.thumbnailBase64 && firstAttachment.mimeType?.startsWith("image/")
            ? `data:${firstAttachment.mimeType};base64,${firstAttachment.thumbnailBase64}`
            : null;
        return (
          <div
            key={expense.id}
            className="relative bg-card/60 rounded-3xl p-4 shadow-sm border border-border/50 animate-slide-up overflow-hidden"
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
                  {expense.category} · {formatDate(expense.date)} · {expense.weekLabel}
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
              {expense.attachments && expense.attachments.length > 0 && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Com comprovante</span>
              )}
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
      })}
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
