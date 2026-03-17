import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Gavel, Hammer, TrendingUp, FileText, Plus } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { EditableTitle } from '@/components/obra/EditableTitle';
import { StatusBadge } from '@/components/obra/StatusBadge';
import { SummaryHeader } from '@/components/obra/SummaryHeader';
import { StatCard } from '@/components/obra/StatCard';
import { MemberContributionCard } from '@/components/obra/MemberContributionCard';
import { ExpenseList } from '@/components/obra/ExpenseList';
import { LegalCostList } from '@/components/obra/LegalCostList';
import { LaborList } from '@/components/obra/LaborList';
import { ExpenseFormDrawer } from '@/components/obra/ExpenseFormDrawer';
import { LegalCostFormDrawer } from '@/components/obra/LegalCostFormDrawer';
import { LaborFormDrawer } from '@/components/obra/LaborFormDrawer';
import { SaleFormDrawer } from '@/components/obra/SaleFormDrawer';
import { MembersConfigDrawer } from '@/components/obra/MembersConfigDrawer';
import { AuditLogList, type AuditEntry } from '@/components/obra/AuditLogList';
import { calculateObraTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { Button } from '@/components/ui/button';
import type { Expense, LegalCost, LaborEntry, Sale, ConstructionMember } from '@/types';
import {
  listJobCosts,
  getJobCostsSummary,
  createJobCost,
  updateJobCost,
  deleteJobCost,
  createJobCostAttachment,
  deleteJobCostAttachment,
  listActivityFeed,
  type JobCostEntry,
  type JobCostPayer,
} from '@/lib/api';

type TabKey = 'resumo' | 'gastos' | 'legais' | 'mao-de-obra' | 'venda' | 'auditoria';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'resumo', label: 'Resumo', icon: TrendingUp },
  { key: 'gastos', label: 'Gastos', icon: Receipt },
  { key: 'legais', label: 'Legais', icon: Gavel },
  { key: 'mao-de-obra', label: 'Mão de obra', icon: Hammer },
  { key: 'venda', label: 'Venda', icon: TrendingUp },
  { key: 'auditoria', label: 'Auditoria', icon: FileText },
];

const ObraDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { constructions, updateConstruction, isLoading: isLoadingObras, error: obrasError, refresh: refreshObras } = useConstructions();
  const construction = constructions.find((c) => c.id === id);

  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [jobCosts, setJobCosts] = useState<JobCostEntry[]>([]);
  const [summary, setSummary] = useState<{ obra: number; legal: number; labor: number; grand: number } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [legalDrawerOpen, setLegalDrawerOpen] = useState(false);
  const [editingLegalCost, setEditingLegalCost] = useState<LegalCost | null>(null);
  const [laborDrawerOpen, setLaborDrawerOpen] = useState(false);
  const [editingLaborEntry, setEditingLaborEntry] = useState<LaborEntry | null>(null);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [membersConfigOpen, setMembersConfigOpen] = useState(false);

  const [members, setMembers] = useState<ConstructionMember[]>(() => {
    return [
      { id: 'm-default-1', constructionId: id!, userId: 'u-default-1', name: 'Sócio 1', email: '', sharePercent: 50 },
      { id: 'm-default-2', constructionId: id!, userId: 'u-default-2', name: 'Sócio 2', email: '', sharePercent: 50 },
    ];
  });

  useEffect(() => {
    if (!id) return;
    setMembers([
      { id: 'm-default-1', constructionId: id, userId: 'u-default-1', name: 'Sócio 1', email: '', sharePercent: 50 },
      { id: 'm-default-2', constructionId: id, userId: 'u-default-2', name: 'Sócio 2', email: '', sharePercent: 50 },
    ]);
  }, [id]);

  const payerFromUserId = useCallback((userId: string): JobCostPayer => {
    const index = members.findIndex((m) => m.userId === userId);
    if (index === 0) return 'BRUNO';
    if (index === 1) return 'ROBERTO';
    return 'OUTRO';
  }, [members]);

  const userIdFromPayer = useCallback((payer: JobCostPayer): string => {
    if (payer === 'BRUNO') return members[0]?.userId ?? 'u-default-1';
    if (payer === 'ROBERTO') return members[1]?.userId ?? 'u-default-2';
    return members[0]?.userId ?? 'u-default-1';
  }, [members]);

  const expenses = useMemo<Expense[]>(() => (
    jobCosts
      .filter((j) => j.source === 'OBRA')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        date: (j.date ?? '').slice(0, 10),
        costType: 'Material',
        category: j.category,
        description: j.description,
        weekLabel: j.weekLabel ?? '',
        quantity: Number(j.quantity ?? 1),
        unitValue: Number(j.unitPrice ?? 0),
        totalValue: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
        receiptImageUrl: null,
        attachments: (j.attachments ?? []).map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileDataBase64: a.fileDataBase64 ?? undefined,
        })),
        supplier: j.supplier ?? undefined,
        invoiceNumber: j.invoiceNumber ?? undefined,
        paymentMethod: j.paymentMethod ?? undefined,
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const legalCosts = useMemo<LegalCost[]>(() => (
    jobCosts
      .filter((j) => j.source === 'LEGAL')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        date: (j.date ?? '').slice(0, 10),
        type: j.category,
        description: j.description,
        value: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const laborEntries = useMemo<LaborEntry[]>(() => (
    jobCosts
      .filter((j) => j.source === 'LABOR')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        weekLabel: j.weekLabel ?? '',
        startDate: (j.date ?? '').slice(0, 10),
        endDate: (j.date ?? '').slice(0, 10),
        service: j.description,
        value: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const [items, sum] = await Promise.all([
        listJobCosts({ jobSiteId: id }),
        getJobCostsSummary(id),
      ]);
      setJobCosts(items);
      setSummary(sum.totals);

      const latest = items.slice(0, 20);
      const feedLists = await Promise.all(
        latest.map((e) => listActivityFeed('JobCostEntry', e.id).catch(() => []))
      );
      const merged = feedLists.flat();
      const byId = new Map<string, any>();
      for (const ev of merged) byId.set(ev.id, ev);
      const sorted = Array.from(byId.values()).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

      const mapped: AuditEntry[] = sorted.map((ev: any) => {
        const action: AuditEntry['action'] =
          String(ev.eventType).includes('CREATED') ? 'create' :
          String(ev.eventType).includes('UPDATED') ? 'update' :
          String(ev.eventType).includes('DELETED') ? 'delete' : 'update';
        const entityType: AuditEntry['entityType'] = 'gasto';
        const label = ev?.payload?.description ? String(ev.payload.description) : `${ev.entityType} ${ev.entityId}`;
        return {
          id: ev.id,
          action,
          entityType,
          entityLabel: label,
          at: ev.createdAt,
        };
      });
      setAuditLog(mapped);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Falha ao carregar dados da API');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(
    () => calculateObraTotals(expenses, legalCosts, laborEntries, members, sale ?? undefined),
    [expenses, legalCosts, laborEntries, members, sale]
  );

  const addAudit = useCallback((action: AuditEntry['action'], entityType: AuditEntry['entityType'], entityLabel: string) => {
    setAuditLog((prev) => [
      { id: `audit-${Date.now()}`, action, entityType, entityLabel, at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  if (!construction) {
    return (
      <MobileShell showNav={false}>
        <div className="flex items-center justify-center min-h-screen text-muted-foreground px-4 text-center">
          {isLoadingObras ? (
            "Carregando obra..."
          ) : obrasError ? (
            <div>
              <p className="mb-3">{obrasError}</p>
              <Button type="button" variant="outline" size="sm" onClick={refreshObras}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            "Obra não encontrada"
          )}
        </div>
      </MobileShell>
    );
  }

  const handleAddExpense = async (data: any, expenseId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.date,
        source: 'OBRA' as const,
        category: data.category,
        description: data.description,
        weekLabel: data.weekLabel || null,
        quantity: data.quantity ?? null,
        unitPrice: data.unitValue ?? null,
        totalAmount: data.totalValue,
        payer: payerFromUserId(data.paidByUserId),
        supplier: data.supplier || null,
        invoiceNumber: data.invoiceNumber || null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      };

      const saved = expenseId ? await updateJobCost(expenseId, dto) : await createJobCost(dto);

      const prev = jobCosts.find((j) => j.id === saved.id);
      const prevAttIds = new Set((prev?.attachments ?? []).map((a) => a.id));
      const nextAtts = (data.attachments ?? []) as Array<{ id: string; fileName: string; mimeType: string; fileDataBase64?: string }>;

      for (const att of nextAtts) {
        if (prevAttIds.has(att.id)) continue;
        if (!att.fileDataBase64) continue;
        await createJobCostAttachment({
          jobCostEntryId: saved.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          storageType: "inline",
          fileDataBase64: att.fileDataBase64,
        });
      }

      const nextIds = new Set(nextAtts.map((a) => a.id));
      for (const prevAtt of prev?.attachments ?? []) {
        if (!nextIds.has(prevAtt.id)) {
          await deleteJobCostAttachment(prevAtt.id);
        }
      }

      await refresh();
      addAudit(expenseId ? 'update' : 'create', 'gasto', data.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar gasto');
    } finally {
      setEditingExpense(null);
      setExpenseDrawerOpen(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDrawerOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;
    try {
      await deleteJobCost(expense.id);
      await refresh();
      addAudit('delete', 'gasto', expense.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir gasto');
    }
  };

  const handleAddLegalCost = async (data: any, costId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.date,
        source: 'LEGAL' as const,
        category: data.type,
        description: data.description,
        weekLabel: null,
        quantity: null,
        unitPrice: null,
        totalAmount: data.value,
        payer: payerFromUserId(data.paidByUserId),
        supplier: null,
        invoiceNumber: null,
        paymentMethod: null,
        notes: data.notes || null,
      };
      await (costId ? updateJobCost(costId, dto) : createJobCost(dto));
      await refresh();
      addAudit(costId ? 'update' : 'create', 'legal', data.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar custo legal');
    } finally {
      setEditingLegalCost(null);
      setLegalDrawerOpen(false);
    }
  };

  const handleEditLegalCost = (cost: LegalCost) => {
    setEditingLegalCost(cost);
    setLegalDrawerOpen(true);
  };

  const handleDeleteLegalCost = async (cost: LegalCost) => {
    if (!window.confirm(`Excluir "${cost.description}"?`)) return;
    try {
      await deleteJobCost(cost.id);
      await refresh();
      addAudit('delete', 'legal', cost.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir custo legal');
    }
  };

  const handleAddLabor = async (data: any, entryId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.startDate,
        source: 'LABOR' as const,
        category: 'Mão de obra',
        description: data.service,
        weekLabel: data.weekLabel || null,
        quantity: null,
        unitPrice: null,
        totalAmount: data.value,
        payer: payerFromUserId(data.paidByUserId),
        supplier: null,
        invoiceNumber: null,
        paymentMethod: null,
        notes: data.notes || null,
      };
      await (entryId ? updateJobCost(entryId, dto) : createJobCost(dto));
      await refresh();
      addAudit(entryId ? 'update' : 'create', 'mao-de-obra', data.service);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar mão de obra');
    } finally {
      setEditingLaborEntry(null);
      setLaborDrawerOpen(false);
    }
  };

  const handleEditLaborEntry = (entry: LaborEntry) => {
    setEditingLaborEntry(entry);
    setLaborDrawerOpen(true);
  };

  const handleDeleteLaborEntry = async (entry: LaborEntry) => {
    if (!window.confirm(`Excluir "${entry.service}"?`)) return;
    try {
      await deleteJobCost(entry.id);
      await refresh();
      addAudit('delete', 'mao-de-obra', entry.service);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir mão de obra');
    }
  };

  const handleRegisterSale = (data: { saleValue: number; commissionValue: number; taxValue: number; otherClosingCosts: number; notes?: string }) => {
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      constructionId: id!,
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      soldAt: new Date().toISOString(),
      notes: data.notes ?? '',
    };
    setSale(newSale);
    updateConstruction(id!, { status: 'VENDIDA', saleValue: data.saleValue });
    addAudit('create', 'venda', `Venda R$ ${data.saleValue.toLocaleString('pt-BR')}`);
    setSaleDrawerOpen(false);
  };

  const handleUpdateSale = (data: { saleValue: number; commissionValue: number; taxValue: number; otherClosingCosts: number; notes?: string }) => {
    if (!sale) return;
    setSale({
      ...sale,
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      notes: data.notes ?? '',
    });
    updateConstruction(id!, { saleValue: data.saleValue });
    addAudit('update', 'venda', `Venda atualizada R$ ${data.saleValue.toLocaleString('pt-BR')}`);
    setSaleDrawerOpen(false);
  };

  const openNewDrawer = () => {
    if (activeTab === 'gastos') {
      setEditingExpense(null);
      setExpenseDrawerOpen(true);
    } else if (activeTab === 'legais') {
      setEditingLegalCost(null);
      setLegalDrawerOpen(true);
    } else if (activeTab === 'mao-de-obra') {
      setEditingLaborEntry(null);
      setLaborDrawerOpen(true);
    }
  };

  return (
    <MobileShell showNav={false}>
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <EditableTitle initialTitle={construction.title} onSave={(t) => console.log('save', t)} />
            </div>
            <StatusBadge status={construction.status} />
          </div>
        </div>
        <div className="flex overflow-x-auto gap-1 px-4 pb-2 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loadError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {loadError}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        {loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            Carregando dados da API…
          </div>
        )}
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <SummaryHeader totals={totals} hasSale={!!sale} />
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Materiais" value={summary?.obra ?? totals.totalExpenses} />
              <StatCard label="Legais" value={summary?.legal ?? totals.totalLegalCosts} />
              <StatCard label="Mão de obra" value={summary?.labor ?? totals.totalLaborCosts} />
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">Quem paga quem</p>
              {(() => {
                const balances = totals.memberStats.map((s) => ({ ...s, balance: Math.round(s.balance * 100) / 100 }));
                const receivers = balances.filter((s) => s.balance > 0).map((s) => ({ ...s, remaining: s.balance }));
                const payers = balances.filter((s) => s.balance < 0).map((s) => ({ ...s, remaining: Math.abs(s.balance) }));
                const transfers: Array<{ from: string; to: string; amount: number }> = [];

                let i = 0;
                let j = 0;
                while (i < payers.length && j < receivers.length) {
                  const p = payers[i];
                  const r = receivers[j];
                  const amt = Math.min(p.remaining, r.remaining);
                  if (amt > 0.009) transfers.push({ from: p.name, to: r.name, amount: amt });
                  p.remaining -= amt;
                  r.remaining -= amt;
                  if (p.remaining <= 0.009) i++;
                  if (r.remaining <= 0.009) j++;
                }

                if (transfers.length === 0) {
                  return <p className="text-sm text-muted-foreground">Sem acerto pendente.</p>;
                }

                return (
                  <div className="space-y-1">
                    {transfers.map((t, idx) => (
                      <p key={idx} className="font-mono font-extrabold text-sm">
                        {t.from} paga {formatCurrency(t.amount)} para {t.to}
                      </p>
                    ))}
                  </div>
                );
              })()}
              <p className="text-[11px] text-muted-foreground mt-2">
                Regra: saldo = totalPago − parteIdeal. Saldo &gt; 0 recebe, saldo &lt; 0 paga.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4">
              <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Sócios</h2>
              <Button variant="outline" size="sm" onClick={() => setMembersConfigOpen(true)}>
                Configurar participação
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Participação: {members.map((m) => `${m.name} ${m.sharePercent}%`).join(' · ')}
            </p>
            <div className="space-y-3">
              {totals.memberStats.map((stat) => (
                <MemberContributionCard key={stat.userId} stat={stat} />
              ))}
            </div>
            <MembersConfigDrawer
              open={membersConfigOpen}
              onOpenChange={setMembersConfigOpen}
              constructionId={id!}
              initialMembers={members}
              onSave={setMembers}
            />
          </div>
        )}

        {activeTab === 'gastos' && (
          <div>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setFilterUser(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${!filterUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Todos
              </button>
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => setFilterUser(m.userId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${filterUser === m.userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <ExpenseList members={members} expenses={expenses} filterByUser={filterUser} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />
            <ExpenseFormDrawer members={members} open={expenseDrawerOpen} onOpenChange={setExpenseDrawerOpen} editingExpense={editingExpense} onSubmit={handleAddExpense} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'legais' && (
          <div>
            <LegalCostList members={members} costs={legalCosts} onEdit={handleEditLegalCost} onDelete={handleDeleteLegalCost} />
            <LegalCostFormDrawer members={members} open={legalDrawerOpen} onOpenChange={setLegalDrawerOpen} editingCost={editingLegalCost} onSubmit={handleAddLegalCost} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'mao-de-obra' && (
          <div>
            <LaborList members={members} entries={laborEntries} onEdit={handleEditLaborEntry} onDelete={handleDeleteLaborEntry} />
            <LaborFormDrawer members={members} open={laborDrawerOpen} onOpenChange={setLaborDrawerOpen} editingEntry={editingLaborEntry} onSubmit={handleAddLabor} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'venda' && (
          <div className="space-y-4">
            {sale ? (
              <>
                <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Dados da Venda</h3>
                    <Button variant="outline" size="sm" onClick={() => setSaleDrawerOpen(true)}>
                      Editar venda
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Valor de Venda</span>
                      <span className="font-mono font-bold text-lg text-primary">{formatCurrency(sale.saleValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Comissão</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.commissionValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Impostos</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.taxValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Outros custos</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.otherClosingCosts)}</span>
                    </div>
                  </div>
                  {sale.notes && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Obs: {sale.notes}</p>
                  )}
                </div>
                <div className="bg-foreground text-background rounded-2xl p-4 shadow-card">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Lucro Líquido</h3>
                  <span className="text-2xl font-mono font-bold text-primary">{formatCurrency(totals.liquidProfit)}</span>
                </div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Acerto Final</h3>
                {totals.memberStats.map((stat) => (
                  <MemberContributionCard key={stat.userId} stat={stat} />
                ))}
                <SaleFormDrawer
                  open={saleDrawerOpen}
                  onOpenChange={setSaleDrawerOpen}
                  initialData={sale}
                  onSubmit={handleUpdateSale}
                />
              </>
            ) : (
              <>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Obra ainda não vendida</p>
                  <p className="text-xs mt-1 mb-4">Registre a venda para ver lucro e acerto final</p>
                  <Button size="lg" onClick={() => setSaleDrawerOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Registrar venda
                  </Button>
                </div>
                <SaleFormDrawer open={saleDrawerOpen} onOpenChange={setSaleDrawerOpen} onSubmit={handleRegisterSale} />
              </>
            )}
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Alterações nesta obra (criar, editar, excluir)</p>
            <AuditLogList entries={auditLog} />
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default ObraDetail;
