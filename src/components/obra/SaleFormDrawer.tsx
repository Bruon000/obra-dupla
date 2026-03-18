import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { Sale } from '@/types';

const saleSchema = z.object({
  saleValue: z.coerce.number().positive('Valor deve ser positivo'),
  commissionPercent: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  taxValue: z.coerce.number().min(0, 'Mínimo 0'),
  otherClosingCosts: z.coerce.number().min(0, 'Mínimo 0'),
  notes: z.string().optional(),
});

export type SaleFormData = z.infer<typeof saleSchema> & {
  commissionValue: number;
};

interface SaleFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando preenchido, o drawer abre em modo edição com esses valores */
  initialData?: Sale | null;
  onSubmit: (data: SaleFormData) => void;
}

export function SaleFormDrawer({ open, onOpenChange, initialData, onSubmit }: SaleFormDrawerProps) {
  const isEdit = !!initialData;
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: { saleValue: 0, commissionPercent: 0, commissionValue: 0, taxValue: 0, otherClosingCosts: 0, notes: '' },
  });

  useEffect(() => {
    if (open && initialData) {
      const percent = initialData.saleValue > 0 ? (initialData.commissionValue / initialData.saleValue) * 100 : 0;
      reset({
        saleValue: initialData.saleValue,
        commissionPercent: Math.round(percent * 100) / 100,
        commissionValue: initialData.commissionValue,
        taxValue: initialData.taxValue,
        otherClosingCosts: initialData.otherClosingCosts,
        notes: initialData.notes ?? '',
      });
    } else if (open && !initialData) {
      reset({ saleValue: 0, commissionPercent: 0, commissionValue: 0, taxValue: 0, otherClosingCosts: 0, notes: '' });
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data: SaleFormData) => {
    const commissionValue = (data.saleValue || 0) * ((data.commissionPercent || 0) / 100);
    onSubmit({ ...data, commissionValue });
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Editar dados da venda' : 'Registrar venda'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <Label>Valor da venda (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" {...register('saleValue')} className="h-12 text-base font-mono mt-1" placeholder="0,00" />
            {errors.saleValue && <p className="text-destructive text-xs mt-1">{errors.saleValue.message}</p>}
          </div>
          <div>
            <Label>Comissão (%)</Label>
            <Input type="number" inputMode="decimal" step="0.01" {...register('commissionPercent')} className="h-12 font-mono mt-1" placeholder="0,00" />
            {errors.commissionPercent && <p className="text-destructive text-xs mt-1">{errors.commissionPercent.message}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">
              Valor estimado:{" "}
              <span className="font-mono font-bold">
                {(() => {
                  const v = watch('saleValue') || 0;
                  const p = watch('commissionPercent') || 0;
                  const amount = v * (p / 100);
                  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                })()}
              </span>
            </p>
          </div>
          <div>
            <Label>Impostos (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" {...register('taxValue')} className="h-12 font-mono mt-1" placeholder="0,00" />
            {errors.taxValue && <p className="text-destructive text-xs mt-1">{errors.taxValue.message}</p>}
          </div>
          <div>
            <Label>Outros custos de fechamento (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" {...register('otherClosingCosts')} className="h-12 font-mono mt-1" placeholder="0,00" />
            {errors.otherClosingCosts && <p className="text-destructive text-xs mt-1">{errors.otherClosingCosts.message}</p>}
          </div>
          <div>
            <Label>Observações</Label>
            <Input {...register('notes')} placeholder="Opcional" className="h-12 mt-1" />
          </div>
          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold">
            {isEdit ? 'Salvar alterações' : 'Marcar obra como vendida'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
