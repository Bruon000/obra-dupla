import { db } from "@/db";
import { sync as syncEndpoint } from "@/api/endpoints";

type SyncResult = {
  serverTime: string;
  changes?: {
    clients?: any[];
    jobsites?: any[];
    quotes?: any[];
    quoteItems?: any[];
    jobCostEntries?: any[];
    jobCostAttachments?: any[];
    deletes?: { entity: string; entityId: string }[];
  };
};

export function useSync() {
  const pushAndPull = async (): Promise<SyncResult> => {
    const pendingClients = (await (db as any).clients?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingJobsites = (await (db as any).jobsites?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingQuotes = (await (db as any).quotes?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingQuoteItems = (await (db as any).quoteItems?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingJobCostEntries = (await (db as any).jobCostEntries?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingJobCostAttachments = (await (db as any).jobCostAttachments?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];
    const pendingDeletes = (await (db as any).deletes?.where?.("pendingSync")?.equals?.(1)?.toArray?.()) ?? [];

    const res = await fetch(syncEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changes: {
          clients: pendingClients,
          jobsites: pendingJobsites,
          quotes: pendingQuotes,
          quoteItems: pendingQuoteItems,
          jobCostEntries: pendingJobCostEntries,
          jobCostAttachments: pendingJobCostAttachments,
          deletes: pendingDeletes.map((d: any) => ({
            entity: d.entity,
            entityId: d.entityId,
            deletedAt: d.deletedAt,
          })),
        },
      }),
    });
    if (!res.ok) throw new Error("Sync failed");
    const data: SyncResult = await res.json();
    const { serverTime, changes = {} } = data;

    for (const row of (changes.clients ?? [])) {
      await (db as any).clients.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }
    for (const row of (changes.jobsites ?? [])) {
      await (db as any).jobsites.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }
    for (const row of (changes.quotes ?? [])) {
      await (db as any).quotes.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }
    for (const row of (changes.quoteItems ?? [])) {
      await (db as any).quoteItems.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }
    for (const row of (changes.jobCostEntries ?? [])) {
      await (db as any).jobCostEntries.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }
    for (const row of (changes.jobCostAttachments ?? [])) {
      await (db as any).jobCostAttachments.put({ ...row, pendingSync: 0, lastSyncedAt: serverTime });
    }

    return data;
  };

  return { pushAndPull };
}
