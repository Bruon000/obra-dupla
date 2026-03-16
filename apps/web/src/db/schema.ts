import Dexie, { type Table } from "dexie";
import type { BaseRow, DeleteRow } from "./types/base";

export type ClientRecord = BaseRow & {
  name?: string;
};

export type JobSiteRecord = BaseRow & {
  name?: string;
};

export type QuoteRecord = BaseRow & {
  jobSiteId?: string;
};

export type QuoteItemRecord = BaseRow & {
  quoteId?: string;
};

export type JobCostEntryRecord = BaseRow & {
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
  paymentMethod?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
};

export type JobCostAttachmentRecord = BaseRow & {
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
};

export class AppDB extends Dexie {
  clients!: Table<ClientRecord, string>;
  jobsites!: Table<JobSiteRecord, string>;
  quotes!: Table<QuoteRecord, string>;
  quoteItems!: Table<QuoteItemRecord, string>;
  jobCostEntries!: Table<JobCostEntryRecord, string>;
  jobCostAttachments!: Table<JobCostAttachmentRecord, string>;
  deletes!: Table<DeleteRow, string>;

  constructor() {
    super("obra_dupla_db");

    this.version(1).stores({
      clients: "id, companyId, updatedAt, pendingSync",
      jobsites: "id, companyId, updatedAt, pendingSync",
      quotes: "id, companyId, jobSiteId, updatedAt, pendingSync",
      quoteItems: "id, companyId, quoteId, updatedAt, pendingSync",
      jobCostEntries: "id, companyId, jobSiteId, date, payer, source, category, updatedAt, pendingSync",
      jobCostAttachments: "id, companyId, jobCostEntryId, updatedAt, pendingSync",
      deletes: "id, entity, entityId, updatedAt, pendingSync",
    });
  }
}

export const db = new AppDB();
