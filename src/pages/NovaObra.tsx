import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '@/components/layout/MobileShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { ArrowLeft } from 'lucide-react';

export default function NovaObra() {
  const navigate = useNavigate();
  const { addConstruction } = useConstructions();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const obra = await addConstruction({
        title: title.trim(),
        address: address.trim(),
        notes: notes.trim(),
        status: 'EM_ANDAMENTO',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        saleValue: 0,
      });
      navigate(`/obras/${obra.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao criar obra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileShell showNav={false}>
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/obras')} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Nova obra</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="title">Nome da obra *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casa Nova Bosque 3"
              className="h-12 mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua das Palmeiras, 123"
              className="h-12 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              className="h-12 mt-1"
            />
          </div>
          <Button type="submit" size="lg" className="w-full h-14 text-base font-bold mt-4">
            {saving ? 'Criando...' : 'Criar obra'}
          </Button>
        </form>
      </div>
    </MobileShell>
  );
}
