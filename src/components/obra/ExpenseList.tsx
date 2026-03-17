import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Expense, ConstructionMember } from '@/types';
import { openAttachment } from '@/lib/attachments';
import { Receipt, Pencil, Trash2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  members: ConstructionMember[];
  expenses: Expense[];
  filterByUser?: string | null;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseList({ members, expenses, filterByUser, onEdit, onDelete }: ExpenseListProps) {
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
        return (
          <div
            key={expense.id}
            className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{expense.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {expense.category} · {formatDate(expense.date)} · {expense.weekLabel}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(expense)} aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(expense)} aria-label="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openAttachment(a)}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {a.fileName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
