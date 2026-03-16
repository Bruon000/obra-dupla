export type ConstructionStatus = 'EM_ANDAMENTO' | 'VENDIDA' | 'PAUSADA';

export interface Construction {
  id: string;
  title: string;
  address: string;
  notes: string;
  status: ConstructionStatus;
  startDate: string;
  endDate: string | null;
  saleValue: number;
  createdAt: string;
}

export interface ConstructionMember {
  id: string;
  constructionId: string;
  userId: string;
  name: string;
  email: string;
  sharePercent: number;
}

export interface Expense {
  id: string;
  constructionId: string;
  date: string;
  costType: string;
  category: string;
  description: string;
  weekLabel: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  paidByUserId: string;
  notes: string;
  receiptImageUrl: string | null;
}

export interface LegalCost {
  id: string;
  constructionId: string;
  date: string;
  type: string;
  description: string;
  value: number;
  paidByUserId: string;
  notes: string;
}

export interface LaborEntry {
  id: string;
  constructionId: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  service: string;
  value: number;
  paidByUserId: string;
  notes: string;
}

export interface Sale {
  id: string;
  constructionId: string;
  saleValue: number;
  commissionValue: number;
  taxValue: number;
  otherClosingCosts: number;
  soldAt: string | null;
  notes: string;
}

export interface MemberStats {
  userId: string;
  name: string;
  sharePercent: number;
  totalPaid: number;
  idealContribution: number;
  balance: number;
  profitShare: number;
  finalSettlement: number;
}

export interface ObraTotals {
  totalExpenses: number;
  totalLegalCosts: number;
  totalLaborCosts: number;
  grandTotal: number;
  liquidProfit: number;
  memberStats: MemberStats[];
}
