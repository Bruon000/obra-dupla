import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LEGAL_TYPES } from '@/lib/job-cost-constants';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { LegalCost, ConstructionMember } from '@/types';

const legalCostSchema = z.object({
  description: z.string().min(3, 'Mínimo 3 caracteres'),
  type: z.string().min(1, 'Selecione um tipo'),
  value: z.coerce.number().positive('Deve ser positivo'),
  paidByUserId: z.string().min(1, 'Selecione quem pagou'),
  date: z.string().min(1, 'Informe a data'),
  notes: z.string().optional(),
});

type LegalCostFormData = z.infer<typeof legalCostSchema>;

const defaultValues: LegalCostFormData = { date: new Date().toISOString().split('T')[0], type: '', paidByUserId: '', notes: '' };

interface LegalCostFormDrawerProps {
  members: ConstructionMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost: LegalCost | null;
  onSubmit: (data: LegalCostFormData, costId?: string) => void;
}

export function LegalCostFormDrawer({ members, open, onOpenChange, editingCost, onSubmit }: LegalCostFormDrawerProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LegalCostFormData>({
    resolver: zodResolver(legalCostSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open && editingCost) {
      reset({ description: editingCost.description, type: editingCost.type, value: editingCost.value, paidByUserId: editingCost.paidByUserId, date: editingCost.date, notes: editingCost.notes || '' });
    } else if (open && !editingCost) reset(defaultValues);
  }, [open, editingCost, reset]);

  const handleFormSubmit = (data: LegalCostFormData) => {
    onSubmit(data, editingCost?.id);
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{editingCost ? 'Editar Custo Legal' : 'Novo Custo Legal'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <Label>Descrição</Label>
            <Input {...register('description')} placeholder="Ex: Alvará de construção" className="h-12 text-base" />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select {...register('type')} className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base">
                <option value="">Selecione</option>
                {LEGAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <p className="text-destructive text-xs mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" inputMode="decimal" step="0.01" {...register('value')} className="h-12 text-base font-mono" placeholder="0,00" />
              {errors.value && <p className="text-destructive text-xs mt-1">{errors.value.message}</p>}
            </div>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" {...register('date')} className="h-12 text-base" />
          </div>
          <div>
            <Label>Quem pagou?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {members.map((m) => (
                <label key={m.userId} className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-emerald-light transition-colors">
                  <input type="radio" value={m.userId} {...register('paidByUserId')} className="sr-only" />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{m.name[0]}</div>
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
          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold">{editingCost ? 'Salvar alterações' : 'Salvar Custo Legal'}</Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
