import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Expense } from '@/types';
import { MEMBERS } from '@/lib/mock-data';
import { Receipt } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  filterByUser?: string | null;
}

export function ExpenseList({ expenses, filterByUser }: ExpenseListProps) {
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
        const payer = MEMBERS.find((m) => m.userId === expense.paidByUserId);
        return (
          <div
            key={expense.id}
            className="bg-card rounded-xl p-4 shadow-sm border border-border animate-slide-up"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{expense.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {expense.category} · {formatDate(expense.date)} · {expense.weekLabel}
                </p>
              </div>
              <span className="font-mono font-bold text-sm ml-2">
                {formatCurrency(expense.totalValue)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                {payer?.name ?? 'N/A'}
              </span>
              {expense.quantity > 1 && (
                <span className="text-[11px] text-muted-foreground">
                  {expense.quantity} × {formatCurrency(expense.unitValue)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
