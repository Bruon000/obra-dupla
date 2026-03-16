import type { Construction, ConstructionMember, Expense, LegalCost, LaborEntry, Sale } from '@/types';

export const MEMBERS: ConstructionMember[] = [
  { id: 'm1', constructionId: 'c1', userId: 'u1', name: 'Bruno', email: 'bruno@email.com', sharePercent: 50 },
  { id: 'm2', constructionId: 'c1', userId: 'u2', name: 'Roberto', email: 'roberto@email.com', sharePercent: 50 },
];

export const CONSTRUCTIONS: Construction[] = [
  {
    id: 'c1',
    title: 'Casa Nova Bosque 3',
    address: 'Rua das Palmeiras, 123 - Bosque',
    notes: 'Casa 3 quartos, 2 banheiros',
    status: 'EM_ANDAMENTO',
    startDate: '2025-01-15',
    endDate: null,
    saleValue: 0,
    createdAt: '2025-01-15',
  },
  {
    id: 'c2',
    title: 'Residencial Safira',
    address: 'Av. Brasil, 456 - Centro',
    notes: 'Sobrado geminado',
    status: 'VENDIDA',
    startDate: '2024-06-01',
    endDate: '2025-02-28',
    saleValue: 480000,
    createdAt: '2024-06-01',
  },
];

export const EXPENSES: Expense[] = [
  { id: 'e1', constructionId: 'c1', date: '2025-01-20', costType: 'Material', category: 'Alvenaria', description: 'Tijolos 9 furos', weekLabel: 'Semana 1', quantity: 2000, unitValue: 1.2, totalValue: 2400, paidByUserId: 'u1', notes: '', receiptImageUrl: null },
  { id: 'e2', constructionId: 'c1', date: '2025-01-22', costType: 'Material', category: 'Alvenaria', description: 'Cimento CP-II', weekLabel: 'Semana 1', quantity: 50, unitValue: 38, totalValue: 1900, paidByUserId: 'u2', notes: '', receiptImageUrl: null },
  { id: 'e3', constructionId: 'c1', date: '2025-01-25', costType: 'Material', category: 'Hidráulica', description: 'Tubos PVC 100mm', weekLabel: 'Semana 2', quantity: 20, unitValue: 45, totalValue: 900, paidByUserId: 'u1', notes: '', receiptImageUrl: null },
  { id: 'e4', constructionId: 'c1', date: '2025-02-01', costType: 'Material', category: 'Elétrica', description: 'Fios e cabos elétricos', weekLabel: 'Semana 3', quantity: 1, unitValue: 3200, totalValue: 3200, paidByUserId: 'u2', notes: 'Compra grande', receiptImageUrl: null },
  { id: 'e5', constructionId: 'c1', date: '2025-02-05', costType: 'Serviço', category: 'Fundação', description: 'Escavação e terraplanagem', weekLabel: 'Semana 3', quantity: 1, unitValue: 4500, totalValue: 4500, paidByUserId: 'u1', notes: '', receiptImageUrl: null },
];

export const LEGAL_COSTS: LegalCost[] = [
  { id: 'l1', constructionId: 'c1', date: '2025-01-15', type: 'Taxa', description: 'Alvará de construção', value: 1200, paidByUserId: 'u1', notes: '' },
  { id: 'l2', constructionId: 'c1', date: '2025-01-18', type: 'Imposto', description: 'ITBI', value: 3500, paidByUserId: 'u2', notes: '' },
];

export const LABOR_ENTRIES: LaborEntry[] = [
  { id: 'lb1', constructionId: 'c1', weekLabel: 'Semana 1', startDate: '2025-01-20', endDate: '2025-01-25', service: 'Pedreiro + Ajudante', value: 2800, paidByUserId: 'u1', notes: '' },
  { id: 'lb2', constructionId: 'c1', weekLabel: 'Semana 2', startDate: '2025-01-27', endDate: '2025-02-01', service: 'Pedreiro + Ajudante', value: 2800, paidByUserId: 'u2', notes: '' },
  { id: 'lb3', constructionId: 'c1', weekLabel: 'Semana 3', startDate: '2025-02-03', endDate: '2025-02-08', service: 'Pedreiro + Encanador', value: 3500, paidByUserId: 'u1', notes: '' },
];

export const SALES: Record<string, Sale> = {
  c2: {
    id: 's1', constructionId: 'c2', saleValue: 480000, commissionValue: 24000, taxValue: 8500, otherClosingCosts: 3200, soldAt: '2025-02-28', notes: 'Venda intermediada por corretor',
  },
};

export const EXPENSE_CATEGORIES = [
  'Alvenaria', 'Hidráulica', 'Elétrica', 'Pintura', 'Acabamento',
  'Fundação', 'Cobertura', 'Esquadrias', 'Piso', 'Ferragens', 'Outros',
];

export const COST_TYPES = ['Material', 'Serviço', 'Ferramenta', 'Transporte', 'Outros'];

export const LEGAL_TYPES = ['Taxa', 'Imposto', 'Cartório', 'Registro', 'Honorário', 'Outros'];
