import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MEMBERS, EXPENSE_CATEGORIES, COST_TYPES } from '@/lib/mock-data';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Plus } from 'lucide-react';

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
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData & { totalValue: number }) => void;
}

export function ExpenseFormDrawer({ onSubmit }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { quantity: 1, unitValue: 0, date: new Date().toISOString().split('T')[0], costType: 'Material', category: '', paidByUserId: '', weekLabel: '', notes: '' },
  });

  const quantity = watch('quantity');
  const unitValue = watch('unitValue');
  const totalValue = (quantity || 0) * (unitValue || 0);

  const handleFormSubmit = (data: ExpenseFormData) => {
    onSubmit({ ...data, totalValue });
    reset();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card">
          <Plus className="w-6 h-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Novo Gasto</DrawerTitle>
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
              {MEMBERS.map((m) => (
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
            <Label>Observações</Label>
            <Input {...register('notes')} placeholder="Opcional" className="h-12 text-base" />
          </div>

          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold">
            Salvar Gasto
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
