export type JobCostSource = "OBRA" | "LEGAL" | "LABOR";
export type JobCostPayer = "BRUNO" | "ROBERTO" | "CAIXA" | "OUTRO";

export type JobCostAttachmentView = {
  id: string;
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  storageType: string;
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type JobCostUserRef = {
  id: string;
  name: string;
  email: string;
};

export type JobCostEntryView = {
  id: string;
  companyId: string;
  jobSiteId: string;
  date: string;
  source: "OBRA" | "LEGAL" | "LABOR";
  category: string;
  description: string;
  weekLabel?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount: number;
  payer: "BRUNO" | "ROBERTO" | "CAIXA" | "OUTRO";
  supplier?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdByUser?: JobCostUserRef | null;
  updatedByUser?: JobCostUserRef | null;
  deletedByUser?: JobCostUserRef | null;
  attachments?: JobCostAttachmentView[];
};

export type JobCostsSummary = {
  jobSiteId: string;
  totals: {
    obra: number;
    legal: number;
    labor: number;
    grand: number;
  };
  settlement: {
    bruno: { paid: number; ideal: number; delta: number };
    roberto: { paid: number; ideal: number; delta: number };
    partnersPaidTotal: number;
  };
  byPayer: Record<string, { total: number; count: number }>;
  bySource: Record<string, { total: number; count: number }>;
  counts: {
    entries: number;
  };
};
