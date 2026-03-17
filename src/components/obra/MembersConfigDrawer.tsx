import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { ConstructionMember } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface MembersConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constructionId: string;
  initialMembers: ConstructionMember[];
  onSave: (members: ConstructionMember[]) => void;
}

function makeMember(constructionId: string, name: string, sharePercent: number, index: number): ConstructionMember {
  const uid = `u-${Date.now()}-${index}`;
  return {
    id: `m-${Date.now()}-${index}`,
    constructionId,
    userId: uid,
    name: name || 'Sócio',
    email: '',
    sharePercent,
  };
}

export function MembersConfigDrawer({
  open,
  onOpenChange,
  constructionId,
  initialMembers,
  onSave,
}: MembersConfigDrawerProps) {
  const [members, setMembers] = useState<ConstructionMember[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMembers(
        initialMembers.length > 0
          ? initialMembers.map((m) => ({ ...m }))
          : [
              makeMember(constructionId, 'Sócio 1', 50, 0),
              makeMember(constructionId, 'Sócio 2', 50, 1),
            ]
      );
      setError('');
    }
  }, [open, constructionId, initialMembers]);

  const totalPercent = members.reduce((acc, m) => acc + (Number(m.sharePercent) || 0), 0);

  const updateMember = (index: number, field: 'name' | 'sharePercent', value: string | number) => {
    setMembers((prev) =>
      prev.map((m, i) =>
        i === index
          ? { ...m, [field]: field === 'sharePercent' ? (typeof value === 'number' ? value : Number(value) || 0) : value }
          : m
      )
    );
    setError('');
  };

  const addMember = () => {
    const rest = 100 - members.reduce((a, m) => a + (Number(m.sharePercent) || 0), 0);
    setMembers((prev) => [...prev, makeMember(constructionId, 'Novo sócio', Math.max(0, Math.round(rest)) || 0, prev.length)]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      setError('É necessário pelo menos um sócio.');
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSave = () => {
    const sum = members.reduce((acc, m) => acc + (Number(m.sharePercent) || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      setError(`A participação deve somar 100%. Atual: ${sum.toFixed(1)}%`);
      return;
    }
    const valid = members.filter((m) => (m.name || '').trim());
    if (valid.length === 0) {
      setError('Informe o nome de pelo menos um sócio.');
      return;
    }
    onSave(
      members.map((m) => ({
        ...m,
        name: (m.name || '').trim() || 'Sócio',
        sharePercent: Number(m.sharePercent) || 0,
      }))
    );
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Participação na obra</DrawerTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Defina os sócios e a porcentagem de cada um. A soma deve ser 100%.
          </p>
        </DrawerHeader>
        <div className="p-4 space-y-4 overflow-y-auto">
          {members.map((m, index) => (
            <div key={m.id} className="flex gap-2 items-end border border-border rounded-lg p-3 bg-card">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={m.name}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                  placeholder="Nome do sócio"
                  className="h-10"
                />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">%</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={m.sharePercent}
                  onChange={(e) => updateMember(index, 'sharePercent', e.target.value)}
                  className="h-10 font-mono"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeMember(index)}
                disabled={members.length <= 1}
                aria-label="Remover sócio"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addMember} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Adicionar sócio
          </Button>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Total:</span>
            <span className={`font-mono font-bold ${Math.abs(totalPercent - 100) < 0.01 ? 'text-primary' : 'text-destructive'}`}>
              {totalPercent.toFixed(1)}%
            </span>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button size="lg" className="w-full h-12 font-bold" onClick={handleSave}>
            Salvar participação
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
