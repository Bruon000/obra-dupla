export type JobCostSource = "OBRA" | "LEGAL" | "LABOR";
export type JobCostPayer = "BRUNO" | "ROBERTO" | "CAIXA" | "OUTRO";

export type JobCostAttachmentView = {
  id: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type JobCostEntryView = {
  id: string;
  companyId: string;
  jobSiteId: string;
  date: string;
  source: JobCostSource;
  category: string;
  description: string;
  weekLabel?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  total: number;
  payer: JobCostPayer;
  supplierName?: string | null;
  documentNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  attachments?: JobCostAttachmentView[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  createdByUser?: { id: string; name?: string | null; email?: string | null } | null;
  updatedByUser?: { id: string; name?: string | null; email?: string | null } | null;
  deletedByUser?: { id: string; name?: string | null; email?: string | null } | null;
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
