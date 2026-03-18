import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { LaborEntry, ConstructionMember, ExpenseAttachment } from '@/types';
import { fileToExpenseAttachment } from '@/lib/attachments';
import { Paperclip, X } from 'lucide-react';

const laborSchema = z.object({
  service: z.string().min(3, 'Mínimo 3 caracteres'),
  weekLabel: z.string().min(1, 'Informe a semana'),
  startDate: z.string().min(1, 'Informe data inicial'),
  endDate: z.string().min(1, 'Informe data final'),
  value: z.coerce.number().positive('Deve ser positivo'),
  paidByUserId: z.string().min(1, 'Selecione quem pagou'),
  notes: z.string().optional(),
});

type LaborFormData = z.infer<typeof laborSchema>;

const defaultValues: LaborFormData = { startDate: '', endDate: '', weekLabel: '', paidByUserId: '', notes: '' };

interface LaborFormDrawerProps {
  members: ConstructionMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry: LaborEntry | null;
  onSubmit: (data: LaborFormData & { attachments?: ExpenseAttachment[] }, entryId?: string) => void;
}

export function LaborFormDrawer({ members, open, onOpenChange, editingEntry, onSubmit }: LaborFormDrawerProps) {
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LaborFormData>({
    resolver: zodResolver(laborSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open && editingEntry) {
      reset({ service: editingEntry.service, weekLabel: editingEntry.weekLabel, startDate: editingEntry.startDate, endDate: editingEntry.endDate, value: editingEntry.value, paidByUserId: editingEntry.paidByUserId, notes: editingEntry.notes || '' });
      setAttachments(editingEntry.attachments ?? []);
    } else if (open && !editingEntry) reset(defaultValues);
    if (!open) setAttachments([]);
  }, [open, editingEntry, reset]);

  const handleFormSubmit = (data: LaborFormData) => {
    onSubmit({ ...data, attachments }, editingEntry?.id);
    reset();
    setAttachments([]);
    onOpenChange(false);
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{editingEntry ? 'Editar Mão de Obra' : 'Nova Mão de Obra'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 overflow-y-auto">
          <div>
            <Label>Serviço</Label>
            <Input {...register('service')} placeholder="Ex: Pedreiro + Ajudante" className="h-12 text-base" />
            {errors.service && <p className="text-destructive text-xs mt-1">{errors.service.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Semana</Label>
              <Input {...register('weekLabel')} placeholder="Semana 1" className="h-12 text-base" />
              {errors.weekLabel && <p className="text-destructive text-xs mt-1">{errors.weekLabel.message}</p>}
            </div>
            <div>
              <Label>De</Label>
              <Input type="date" {...register('startDate')} className="h-12 text-base" />
            </div>
            <div>
              <Label>Até</Label>
              <Input type="date" {...register('endDate')} className="h-12 text-base" />
            </div>
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" {...register('value')} className="h-12 text-xl font-mono" placeholder="0,00" />
            {errors.value && <p className="text-destructive text-xs mt-1">{errors.value.message}</p>}
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
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="shrink-0 p-1 text-destructive hover:bg-destructive/10 rounded"
                        aria-label="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold">{editingEntry ? 'Salvar alterações' : 'Salvar Mão de Obra'}</Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
