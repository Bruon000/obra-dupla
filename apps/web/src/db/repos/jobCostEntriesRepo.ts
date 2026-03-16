import type { BaseRow } from "@/db/types/base";
import { makeRepo } from "../makeRepo";
import { db } from "../schema";

export type JobCostEntryRow = BaseRow & {
  jobSiteId: string;
  date: string;
  source: "OBRA" | "LEGAL" | "LABOR";
  category: string;
  description: string;
  weekLabel?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  payer: string;
  supplier?: string | null;
  paymentMethod?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
};

export const jobCostEntriesRepo = makeRepo<JobCostEntryRow>("jobCostEntries");

export async function removeJobCostEntryCascade(id: string) {
  const attachments = await db.jobCostAttachments.where("jobCostEntryId").equals(id).toArray();

  await db.transaction("rw", db.jobCostEntries, db.jobCostAttachments, db.deletes, async () => {
    for (const attachment of attachments) {
      await db.jobCostAttachments.delete(attachment.id);
      await db.deletes.put({
        id: crypto.randomUUID(),
        entity: "jobCostAttachments",
        entityId: attachment.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      } as any);
    }

    await db.jobCostEntries.delete(id);
    await db.deletes.put({
      id: crypto.randomUUID(),
      entity: "jobCostEntries",
      entityId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    } as any);
  });
}
