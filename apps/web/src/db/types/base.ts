export type EntityName =
  | "clients"
  | "jobsites"
  | "quotes"
  | "quoteItems"
  | "jobCostEntries"
  | "jobCostAttachments";

export type BaseRow = {
  id: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  version: number;
  pendingSync?: 0 | 1;
  deviceId?: string | null;
  lastSyncedAt?: string | null;
};

export type DeleteRow = {
  id: string;
  entity: EntityName;
  entityId: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  pendingSync?: 0 | 1;
};
