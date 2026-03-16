import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Gavel, Hammer, TrendingUp } from 'lucide-react';
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
import { calculateObraTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { CONSTRUCTIONS, MEMBERS, EXPENSES, LEGAL_COSTS, LABOR_ENTRIES, SALES } from '@/lib/mock-data';
import type { Expense, LegalCost, LaborEntry } from '@/types';

type TabKey = 'resumo' | 'gastos' | 'legais' | 'mao-de-obra' | 'venda';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'resumo', label: 'Resumo', icon: TrendingUp },
  { key: 'gastos', label: 'Gastos', icon: Receipt },
  { key: 'legais', label: 'Legais', icon: Gavel },
  { key: 'mao-de-obra', label: 'Mão de obra', icon: Hammer },
  { key: 'venda', label: 'Venda', icon: TrendingUp },
];

const ObraDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [filterUser, setFilterUser] = useState<string | null>(null);

  const construction = CONSTRUCTIONS.find((c) => c.id === id);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES.filter((e) => e.constructionId === id));
  const [legalCosts, setLegalCosts] = useState<LegalCost[]>(LEGAL_COSTS.filter((l) => l.constructionId === id));
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>(LABOR_ENTRIES.filter((l) => l.constructionId === id));
  const sale = SALES[id!];
  const members = MEMBERS.filter((m) => m.constructionId === id);

  if (!construction) {
    return (
      <MobileShell showNav={false}>
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">
          Obra não encontrada
        </div>
      </MobileShell>
    );
  }

  const totals = useMemo(
    () => calculateObraTotals(expenses, legalCosts, laborEntries, members, sale),
    [expenses, legalCosts, laborEntries, members, sale]
  );

  const handleAddExpense = (data: any) => {
    const newExpense: Expense = {
      id: `e-${Date.now()}`,
      constructionId: id!,
      ...data,
      receiptImageUrl: null,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleAddLegalCost = (data: any) => {
    const newCost: LegalCost = {
      id: `l-${Date.now()}`,
      constructionId: id!,
      ...data,
    };
    setLegalCosts((prev) => [newCost, ...prev]);
  };

  const handleAddLabor = (data: any) => {
    const newEntry: LaborEntry = {
      id: `lb-${Date.now()}`,
      constructionId: id!,
      ...data,
    };
    setLaborEntries((prev) => [newEntry, ...prev]);
  };

  return (
    <MobileShell showNav={false}>
      {/* Header */}
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

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 px-4 pb-2 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <SummaryHeader totals={totals} />
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Materiais" value={totals.totalExpenses} />
              <StatCard label="Legais" value={totals.totalLegalCosts} />
              <StatCard label="Mão de obra" value={totals.totalLaborCosts} />
            </div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-4">Sócios</h2>
            <div className="space-y-3">
              {totals.memberStats.map((stat) => (
                <MemberContributionCard key={stat.userId} stat={stat} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gastos' && (
          <div>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setFilterUser(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  !filterUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                Todos
              </button>
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => setFilterUser(m.userId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                    filterUser === m.userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <ExpenseList expenses={expenses} filterByUser={filterUser} />
            <ExpenseFormDrawer onSubmit={handleAddExpense} />
          </div>
        )}

        {activeTab === 'legais' && (
          <div>
            <LegalCostList costs={legalCosts} />
            <LegalCostFormDrawer onSubmit={handleAddLegalCost} />
          </div>
        )}

        {activeTab === 'mao-de-obra' && (
          <div>
            <LaborList entries={laborEntries} />
            <LaborFormDrawer onSubmit={handleAddLabor} />
          </div>
        )}

        {activeTab === 'venda' && (
          <div className="space-y-4">
            {sale ? (
              <>
                <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Dados da Venda</h3>
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
                </div>
                <div className="bg-foreground text-background rounded-2xl p-4 shadow-card">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Lucro Líquido</h3>
                  <span className="text-2xl font-mono font-bold text-primary">{formatCurrency(totals.liquidProfit)}</span>
                </div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Acerto Final</h3>
                {totals.memberStats.map((stat) => (
                  <MemberContributionCard key={stat.userId} stat={stat} />
                ))}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Obra ainda não vendida</p>
                <p className="text-xs mt-1">O cálculo de lucro aparecerá após registrar a venda</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default ObraDetail;
