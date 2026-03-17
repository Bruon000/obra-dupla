import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EXPENSE_CATEGORIES, COST_TYPES } from '@/lib/job-cost-constants';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { fileToExpenseAttachment } from '@/lib/attachments';
import type { Expense, ExpenseAttachment, ConstructionMember } from '@/types';
import { Paperclip, X } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(3, 'Mínimo 3 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
  costType: z.string().min(1, 'Selecione um tipo'),
  quantity: z.coerce.number().positive('Deve ser positivo'),
  unitValue: z.coerce.number().positive('Deve ser positivo'),
  paidByUserId: z.string().min(1, 'Selecione quem pagou'),
  date: z.string().min(1, 'Informe a data'),
  weekLabel: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const defaultValues: ExpenseFormData = {
  quantity: 1, unitValue: 0, date: new Date().toISOString().split('T')[0],
  costType: 'Material', category: '', paidByUserId: '', weekLabel: '', notes: '',
  supplier: '', invoiceNumber: '', paymentMethod: '',
};

export type ExpenseSubmitData = ExpenseFormData & {
  totalValue: number;
  attachments?: ExpenseAttachment[];
};

interface ExpenseFormDrawerProps {
  members: ConstructionMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: Expense | null;
  onSubmit: (data: ExpenseSubmitData, expenseId?: string) => void;
}

export function ExpenseFormDrawer({ members, open, onOpenChange, editingExpense, onSubmit }: ExpenseFormDrawerProps) {
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open && editingExpense) {
      reset({
        description: editingExpense.description,
        category: editingExpense.category,
        costType: editingExpense.costType,
        quantity: editingExpense.quantity,
        unitValue: editingExpense.unitValue,
        paidByUserId: editingExpense.paidByUserId,
        date: editingExpense.date,
        weekLabel: editingExpense.weekLabel || '',
        notes: editingExpense.notes || '',
        supplier: editingExpense.supplier || '',
        invoiceNumber: editingExpense.invoiceNumber || '',
        paymentMethod: editingExpense.paymentMethod || '',
      });
      setAttachments(editingExpense.attachments ?? []);
    } else if (open && !editingExpense) {
      reset(defaultValues);
      setAttachments([]);
    }
  }, [open, editingExpense, reset]);

  const quantity = watch('quantity');
  const unitValue = watch('unitValue');
  const totalValue = (quantity || 0) * (unitValue || 0);

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const att = await fileToExpenseAttachment(files[i]);
      setAttachments((prev) => [...prev, att]);
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFormSubmit = (data: ExpenseFormData) => {
    onSubmit({ ...data, totalValue, attachments }, editingExpense?.id);
    reset();
    setAttachments([]);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{editingExpense ? 'Editar Gasto' : 'Novo Gasto'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <Label>Descrição</Label>
            <Input {...register('description')} placeholder="Ex: Tijolos 9 furos" className="h-12 text-base" />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select {...register('costType')} className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base">
                {COST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Categoria</Label>
              <select {...register('category')} className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base">
                <option value="">Selecione</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Qtd</Label>
              <Input type="number" inputMode="decimal" {...register('quantity')} className="h-12 text-base font-mono" />
            </div>
            <div>
              <Label>Valor unit.</Label>
              <Input type="number" inputMode="decimal" step="0.01" {...register('unitValue')} className="h-12 text-base font-mono" placeholder="0,00" />
            </div>
            <div>
              <Label>Total</Label>
              <div className="h-12 flex items-center px-3 rounded-lg bg-muted font-mono font-bold text-base">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" {...register('date')} className="h-12 text-base" />
            </div>
            <div>
              <Label>Semana</Label>
              <Input {...register('weekLabel')} placeholder="Semana 1" className="h-12 text-base" />
            </div>
          </div>

          <div>
            <Label>Quem pagou?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {members.map((m) => (
                <label key={m.userId} className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-emerald-light transition-colors">
                  <input type="radio" value={m.userId} {...register('paidByUserId')} className="sr-only" />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {m.name[0]}
                  </div>
                  <span className="font-medium text-sm">{m.name}</span>
                </label>
              ))}
            </div>
            {errors.paidByUserId && <p className="text-destructive text-xs mt-1">{errors.paidByUserId.message}</p>}
          </div>

          <div>
            <Label>Fornecedor</Label>
            <Input {...register('supplier')} placeholder="Opcional" className="h-12 text-base" />
          </div>
          <div>
            <Label>Nº nota / comprovante</Label>
            <Input {...register('invoiceNumber')} placeholder="Opcional" className="h-12 text-base" />
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <Input {...register('paymentMethod')} placeholder="Ex: PIX, cartão" className="h-12 text-base" />
          </div>
          <div>
            <Label>Observações</Label>
            <Input {...register('notes')} placeholder="Opcional" className="h-12 text-base" />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Anexos / comprovantes
            </Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center justify-center gap-2 h-12 rounded-lg border border-dashed border-border bg-muted/50 cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                <input type="file" className="sr-only" accept="image/*,.pdf" multiple onChange={onFileSelect} />
                Adicionar foto ou PDF
              </label>
              {attachments.length > 0 && (
                <ul className="space-y-1">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="truncate">{a.fileName}</span>
                      <button type="button" onClick={() => removeAttachment(a.id)} className="shrink-0 p-1 text-destructive hover:bg-destructive/10 rounded" aria-label="Remover">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold">
            {editingExpense ? 'Salvar alterações' : 'Salvar Gasto'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
