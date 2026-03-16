import type { PrismaClient } from "@prisma/client";

function pickClientFields(row: any) {
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name ?? "",
  };
}

function pickJobCostEntryFields(row: any) {
  return {
    id: row.id,
    jobSiteId: row.jobSiteId,
    date: row.date ? new Date(row.date) : new Date(),
    source: row.source ?? "OBRA",
    category: row.category ?? "OUTROS",
    description: row.description ?? "",
    weekLabel: row.weekLabel ?? null,
    quantity: row.quantity ?? 1,
    unitPrice: row.unitPrice ?? 0,
    totalAmount: row.totalAmount ?? row.total ?? 0,
    payer: row.payer ?? "",
    supplier: row.supplier ?? null,
    paymentMethod: row.paymentMethod ?? null,
    invoiceNumber: row.invoiceNumber ?? null,
    notes: row.notes ?? null,
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    version: row.version ?? 1,
    deviceId: row.deviceId ?? null,
  };
}

function pickJobCostAttachmentFields(row: any) {
  return {
    id: row.id,
    jobCostEntryId: row.jobCostEntryId,
    fileName: row.fileName ?? "arquivo",
    mimeType: row.mimeType ?? "application/octet-stream",
    storageType: row.storageType ?? "inline",
    fileDataBase64: row.fileDataBase64 ?? null,
    fileUrl: row.fileUrl ?? null,
    thumbnailBase64: row.thumbnailBase64 ?? null,
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    version: row.version ?? 1,
    deviceId: row.deviceId ?? null,
  };
}

export class SyncService {
  constructor(private prisma: PrismaClient) {}

  async applyChanges(companyId: string, serverTime: string, payload: {
    changes?: {
      clients?: any[];
      jobsites?: any[];
      quotes?: any[];
      quoteItems?: any[];
      jobCostEntries?: any[];
      jobCostAttachments?: any[];
      deletes?: { table: string; id: string }[];
    };
  }) {
    const { changes = {}, deletes } = payload as any;
    const conflicts: { table: string; id: string; reason: string }[] = [];

    if (changes.clients?.length) {
      for (const row of changes.clients) {
        try {
          const data = pickClientFields(row);
          await this.prisma.client.upsert({
            where: { id: data.id },
            create: { ...data, companyId, lastSyncedAt: new Date(serverTime) } as any,
            update: { ...data, lastSyncedAt: new Date(serverTime) } as any,
          });
        } catch (e) {
          conflicts.push({ table: "clients", id: row.id, reason: String(e) });
        }
      }
    }

    if (changes.jobsites?.length) {
      for (const row of changes.jobsites) {
        try {
          await this.prisma.jobSite.upsert({
            where: { id: row.id },
            create: { id: row.id, companyId, ...row, lastSyncedAt: new Date(serverTime) } as any,
            update: { ...row, lastSyncedAt: new Date(serverTime) } as any,
          });
        } catch (e) {
          conflicts.push({ table: "jobsites", id: row.id, reason: String(e) });
        }
      }
    }

    if (changes.quotes?.length) {
      for (const row of changes.quotes) {
        try {
          await this.prisma.quote.upsert({
            where: { id: row.id },
            create: { id: row.id, companyId, jobSiteId: row.jobSiteId, ...row, lastSyncedAt: new Date(serverTime) } as any,
            update: { ...row, lastSyncedAt: new Date(serverTime) } as any,
          });
        } catch (e) {
          conflicts.push({ table: "quotes", id: row.id, reason: String(e) });
        }
      }
    }

    if (changes.jobCostEntries?.length) {
      for (const row of changes.jobCostEntries) {
        try {
          const data = pickJobCostEntryFields(row);
          await this.prisma.jobCostEntry.upsert({
            where: { id: data.id },
            create: { ...data, companyId, lastSyncedAt: new Date(serverTime) } as any,
            update: { ...data, lastSyncedAt: new Date(serverTime) } as any,
          });
        } catch (e) {
          conflicts.push({ table: "jobCostEntries", id: row.id, reason: String(e) });
        }
      }
    }

    if (changes.jobCostAttachments?.length) {
      for (const row of changes.jobCostAttachments) {
        try {
          const data = pickJobCostAttachmentFields(row);
          await this.prisma.jobCostAttachment.upsert({
            where: { id: data.id },
            create: { ...data, companyId, lastSyncedAt: new Date(serverTime) } as any,
            update: { ...data, lastSyncedAt: new Date(serverTime) } as any,
          });
        } catch (e) {
          conflicts.push({ table: "jobCostAttachments", id: row.id, reason: String(e) });
        }
      }
    }

    if (deletes?.length) {
      for (const d of deletes) {
        try {
          if (d.entity === "clients") await this.prisma.client.updateMany({ where: { id: d.entityId, companyId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } as any });
          if (d.entity === "jobsites") await this.prisma.jobSite.updateMany({ where: { id: d.entityId, companyId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } as any });
          if (d.entity === "quotes") await this.prisma.quote.updateMany({ where: { id: d.entityId, companyId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } as any });
          if (d.entity === "quoteItems") await (this.prisma as any).quoteItem?.updateMany?.({ where: { id: d.entityId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } });
          if (d.entity === "jobCostEntries") await this.prisma.jobCostEntry.updateMany({ where: { id: d.entityId, companyId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } as any });
          if (d.entity === "jobCostAttachments") await this.prisma.jobCostAttachment.updateMany({ where: { id: d.entityId, companyId }, data: { deletedAt: new Date(d.deletedAt ?? serverTime) } as any });
        } catch {}
      }
    }

    return { conflicts };
  }

  async getServerChanges(companyId: string, lastSyncDate: Date) {
    const serverChanges: any = {
      clients: [],
      jobsites: [],
      quotes: [],
      quoteItems: [],
      jobCostEntries: [],
      jobCostAttachments: [],
      deletes: [],
    };

    const clients = await this.prisma.client.findMany({ where: { companyId, updatedAt: { gt: lastSyncDate } } });
    serverChanges.clients = clients;

    const jobsites = await this.prisma.jobSite.findMany({ where: { companyId, updatedAt: { gt: lastSyncDate } } });
    serverChanges.jobsites = jobsites;

    const quotes = await this.prisma.quote.findMany({ where: { companyId, updatedAt: { gt: lastSyncDate } }, include: { items: true } } as any);
    serverChanges.quotes = quotes.map((q: any) => { const { items, ...rest } = q; return rest; });
    serverChanges.quoteItems = quotes.flatMap((q: any) => q.items ?? []);

    const jobCostEntries = await this.prisma.jobCostEntry.findMany({
      where: { companyId, updatedAt: { gt: lastSyncDate } },
      orderBy: { date: "desc" },
    });
    serverChanges.jobCostEntries = jobCostEntries;

    const jobCostAttachments = await this.prisma.jobCostAttachment.findMany({
      where: { companyId, updatedAt: { gt: lastSyncDate } },
      orderBy: { createdAt: "desc" },
    });
    serverChanges.jobCostAttachments = jobCostAttachments;

    const deletedClients = await this.prisma.client.findMany({ where: { companyId, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true } } as any);
    const deletedJobsites = await this.prisma.jobSite.findMany({ where: { companyId, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true } } as any);
    const deletedQuotes = await this.prisma.quote.findMany({ where: { companyId, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true } });
    const deletedJobCostEntries = await this.prisma.jobCostEntry.findMany({ where: { companyId, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true } });
    const deletedJobCostAttachments = await this.prisma.jobCostAttachment.findMany({ where: { companyId, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true } });

    const companyQuoteIds = (await this.prisma.quote.findMany({ where: { companyId }, select: { id: true } })).map(q => q.id);
    const deletedQuoteItems = await (this.prisma as any).quoteItem?.findMany?.({ where: { quoteId: { in: companyQuoteIds }, deletedAt: { gt: lastSyncDate } }, select: { id: true, deletedAt: true, quoteId: true } }) ?? [];

    serverChanges.deletes = [
      ...(deletedClients ?? []).map((x: any) => ({ entity: "clients", entityId: x.id, deletedAt: x.deletedAt })),
      ...(deletedJobsites ?? []).map((x: any) => ({ entity: "jobsites", entityId: x.id, deletedAt: x.deletedAt })),
      ...deletedQuotes.map(x => ({ entity: "quotes", entityId: x.id, deletedAt: x.deletedAt })),
      ...(deletedQuoteItems ?? []).map((x: any) => ({ entity: "quoteItems", entityId: x.id, deletedAt: x.deletedAt })),
      ...deletedJobCostEntries.map(x => ({ entity: "jobCostEntries", entityId: x.id, deletedAt: x.deletedAt })),
      ...deletedJobCostAttachments.map(x => ({ entity: "jobCostAttachments", entityId: x.id, deletedAt: x.deletedAt })),
    ];

    return serverChanges;
  }
}
