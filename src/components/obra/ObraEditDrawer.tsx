import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { Construction, ConstructionStatus } from '@/types';

const STATUS_OPTIONS: { value: ConstructionStatus; label: string }[] = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'VENDIDA', label: 'Vendida' },
  { value: 'PAUSADA', label: 'Pausada' },
];

const obraEditSchema = z.object({
  title: z.string().min(1, 'Informe o nome da obra'),
  address: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['EM_ANDAMENTO', 'VENDIDA', 'PAUSADA', 'ENTREGUE']),
});

type ObraEditFormData = z.infer<typeof obraEditSchema>;

interface ObraEditDrawerProps {
  construction: Construction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Construction>) => Promise<void>;
}

export function ObraEditDrawer({ construction, open, onOpenChange, onSave }: ObraEditDrawerProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ObraEditFormData>({
    resolver: zodResolver(obraEditSchema),
    defaultValues: {
      title: '',
      address: '',
      notes: '',
      startDate: '',
      endDate: '',
      status: 'EM_ANDAMENTO' as const,
    },
  });

  useEffect(() => {
    if (open && construction) {
      reset({
        title: construction.title ?? '',
        address: construction.address ?? '',
        notes: construction.notes ?? '',
        startDate: (construction.startDate ?? '').slice(0, 10),
        endDate: (construction.endDate ?? '').slice(0, 10) || '',
        status: (construction.status ?? 'EM_ANDAMENTO') as ObraEditFormData['status'],
      });
    }
  }, [open, construction, reset]);

  const onSubmit = async (data: ObraEditFormData) => {
    await onSave({
      title: data.title.trim(),
      address: data.address?.trim() ?? '',
      notes: data.notes?.trim() ?? '',
      startDate: data.startDate?.trim() || null,
      endDate: data.endDate?.trim() || null,
      status: data.status,
    });
    onOpenChange(false);
  };

  if (!construction) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Editar obra</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <Label>Nome da obra</Label>
            <Input {...register('title')} placeholder="Ex: Casa Bosque" className="h-12 text-base mt-1" />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label>Endereço</Label>
            <Input {...register('address')} placeholder="Opcional" className="h-12 text-base mt-1" />
          </div>
          <div>
            <Label>Observações</Label>
            <Input {...register('notes')} placeholder="Opcional" className="h-12 text-base mt-1" />
          </div>
          <div>
            <Label>Status da obra</Label>
            <select
              {...register('status')}
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base mt-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Previsão de início</Label>
              <Input type="date" {...register('startDate')} className="h-12 text-base mt-1" />
            </div>
            <div>
              <Label>Previsão de entrega</Label>
              <Input type="date" {...register('endDate')} className="h-12 text-base mt-1" />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
