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

function parseFlexibleNumber(raw: string): number {
  const value = raw.replace(/\s/g, "");
  if (!value) return 0;

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");
  let normalized = value;

  if (hasComma && hasDot) {
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Formato BR: 10.000,00 -> 10000.00
      normalized = value.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato EN: 10,000.00 -> 10000.00
      normalized = value.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Somente vírgula: 10000,50 -> 10000.50
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else {
    // Somente ponto ou só dígitos: deixa como está
    normalized = value;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function ExpenseFormDrawer({ members, open, onOpenChange, editingExpense, onSubmit }: ExpenseFormDrawerProps) {
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ExpenseFormData>({
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
      setTotalOverride(null);
    }
  }, [open, editingExpense, reset]);

  const quantity = watch('quantity');
  const unitValue = watch('unitValue');
  const calculatedTotal = (quantity || 0) * (unitValue || 0);
  const totalValue = totalOverride ?? calculatedTotal;

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const nextTotal = parseFlexibleNumber(raw);
    setTotalOverride(nextTotal);
    if (quantity && quantity > 0) {
      const unit = nextTotal / quantity;
      if (Number.isFinite(unit)) {
        setValue('unitValue', unit, { shouldValidate: true });
      }
    }
  };

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
    onSubmit({ ...data, totalValue: totalValue || 0, attachments }, editingExpense?.id);
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
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={Number.isFinite(totalValue) ? totalValue : 0}
                onChange={handleTotalChange}
                className="h-12 text-base font-mono"
                placeholder="0,00"
              />
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
            <select
              {...register('paymentMethod')}
              className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base"
            >
              <option value="">Selecione</option>
              <option value="PIX">PIX</option>
              <option value="Cartão crédito">Cartão crédito</option>
              <option value="Cartão débito">Cartão débito</option>
              <option value="Boleto">Boleto</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Transferência">Transferência</option>
              <option value="Outro">Outro</option>
            </select>
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
              <div className="flex gap-2 flex-wrap">
                <label className="flex items-center justify-center gap-2 h-12 px-3 rounded-lg border border-dashed border-border bg-muted/50 cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                  <input type="file" className="sr-only" accept="image/*,.pdf" multiple onChange={onFileSelect} />
                  Adicionar foto / PDF
                </label>
                <label className="flex items-center justify-center gap-2 h-12 px-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground">
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={onFileSelect}
                  />
                  Tirar foto
                </label>
              </div>
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
