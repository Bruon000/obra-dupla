export type ConstructionStatus = 'EM_ANDAMENTO' | 'VENDIDA' | 'PAUSADA' | 'ENTREGUE';

export interface Construction {
  id: string;
  title: string;
  address: string;
  notes: string;
  status: ConstructionStatus;
  startDate: string;
  endDate: string | null;
  saleValue: number;
  commissionValue?: number;
  taxValue?: number;
  otherClosingCosts?: number;
  soldAt?: string | null;
  saleNotes?: string;
  createdAt: string;
}

export interface ConstructionMember {
  id: string;
  constructionId: string;
  userId: string;
  name: string;
  email: string;
  sharePercent: number;
  sortIndex?: number;
  createdAt?: string;
}

export interface ExpenseAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileDataBase64?: string;
  thumbnailBase64?: string | null;
  createdAt?: string;
  createdByUser?: { id: string; name: string; email: string } | null;
}

export interface Expense {
  id: string;
  constructionId: string;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
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
  receiptImageUrl?: string | null;
  /** Anexos/comprovantes (fotos, PDFs) */
  attachments?: ExpenseAttachment[];
  supplier?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  /** Para exibir etiqueta "Editado" quando o lançamento foi alterado após criação */
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LegalCost {
  id: string;
  constructionId: string;
  createdByUserId?: string | null;
  date: string;
  type: string;
  description: string;
  value: number;
  paidByUserId: string;
  notes: string;
  attachments?: ExpenseAttachment[];
  createdAt?: string | null;
  updatedAt?: string | null;
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
  attachments?: ExpenseAttachment[];
  createdByUserId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  totalMaterialCosts: number;
  totalServiceCosts: number;
  totalExpenses: number;
  totalLegalCosts: number;
  totalLaborCosts: number;
  grandTotal: number;
  liquidProfit: number;
  memberStats: MemberStats[];
}

export type JobSiteDocumentCategory =
  | "CONTRATO"
  | "PLANTA"
  | "FOTO"
  | "ALVARA"
  | "NF"
  | "RECIBO"
  | "OUTROS";

export interface JobSiteDocument {
  id: string;
  jobSiteId: string;
  category: JobSiteDocumentCategory | string;
  title: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote" | string;
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdByUser?: { id: string; name: string; email: string } | null;
  uploadedByUserId?: string | null;
}
