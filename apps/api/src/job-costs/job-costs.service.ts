import { Injectable, NotFoundException } from "@nestjs/common";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";
import { ListJobCostsDto } from "./dto/list-job-costs.dto";
import { UpsertJobCostDto } from "./dto/upsert-job-cost.dto";

type SummaryBucket = {
  total: number;
  count: number;
};

@Injectable()
export class JobCostsService {
  constructor(
  private prisma: PrismaService,
  private activityFeed: ActivityFeedService,
) {}

  async list(query: ListJobCostsDto) {
    return this.prisma.jobCostEntry.findMany({
      where: {
        jobSiteId: query.jobSiteId,
        ...(query.source ? { source: query.source } : {}),
        ...(query.payer ? { payer: query.payer } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...((query.from || query.to)
          ? {
              date: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        updatedByUser: { select: { id: true, name: true, email: true } },
        deletedByUser: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(companyId: string, userId: string, dto: UpsertJobCostDto) {
    const created = await this.prisma.jobCostEntry.create({
      data: {
        companyId,
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        description: dto.description,
        weekLabel: dto.weekLabel ?? null,
        quantity: dto.quantity ?? null,
        unitPrice: dto.unitPrice ?? null,
        totalAmount: dto.totalAmount,
        payer: dto.payer,
        supplier: dto.supplier ?? null,
        invoiceNumber: dto.invoiceNumber ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes ?? null,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        updatedByUser: { select: { id: true, name: true, email: true } },
        deletedByUser: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_CREATED",
      "JobCostEntry",
      created.id,
      {
        description: created.description,
        totalAmount: created.totalAmount,
        payer: created.payer,
        source: created.source,
        category: created.category,
      },
    );

    return created;
  }

  async update(companyId: string, userId: string, id: string, dto: UpsertJobCostDto) {
    const existing = await this.prisma.jobCostEntry.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException("Lançamento não encontrado");
    }

    const updated = await this.prisma.jobCostEntry.update({
      where: { id },
      data: {
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        description: dto.description,
        weekLabel: dto.weekLabel ?? null,
        quantity: dto.quantity ?? null,
        unitPrice: dto.unitPrice ?? null,
        totalAmount: dto.totalAmount,
        payer: dto.payer,
        supplier: dto.supplier ?? null,
        invoiceNumber: dto.invoiceNumber ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes ?? null,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        updatedByUser: { select: { id: true, name: true, email: true } },
        deletedByUser: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_UPDATED",
      "JobCostEntry",
      updated.id,
      {
        before: {
          description: existing.description,
          totalAmount: existing.totalAmount,
          payer: existing.payer,
          category: existing.category,
          source: existing.source,
        },
        after: {
          description: updated.description,
          totalAmount: updated.totalAmount,
          payer: updated.payer,
          category: updated.category,
          source: updated.source,
        },
      },
    );

    return updated;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.prisma.jobCostEntry.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException("Lançamento não encontrado");
    }

    const deleted = await this.prisma.jobCostEntry.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByUserId: userId,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        updatedByUser: { select: { id: true, name: true, email: true } },
        deletedByUser: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_DELETED",
      "JobCostEntry",
      deleted.id,
      {
        description: existing.description,
        totalAmount: existing.totalAmount,
        payer: existing.payer,
      },
    );

    return deleted;
  }

  async summary(jobSiteId: string) {
    const entries = await this.prisma.jobCostEntry.findMany({
      where: { jobSiteId },
      select: {
        id: true,
        source: true,
        payer: true,
        total: true,
      },
    });

    const bySource: Record<string, SummaryBucket> = {
      OBRA: { total: 0, count: 0 },
      LEGAL: { total: 0, count: 0 },
      LABOR: { total: 0, count: 0 },
    };

    const byPayer: Record<string, SummaryBucket> = {
      BRUNO: { total: 0, count: 0 },
      ROBERTO: { total: 0, count: 0 },
      CAIXA: { total: 0, count: 0 },
      OUTRO: { total: 0, count: 0 },
    };

    let grandTotal = 0;

    for (const entry of entries) {
      const total = Number(entry.total ?? 0);
      grandTotal += total;

      if (!bySource[entry.source]) bySource[entry.source] = { total: 0, count: 0 };
      bySource[entry.source].total += total;
      bySource[entry.source].count += 1;

      if (!byPayer[entry.payer]) byPayer[entry.payer] = { total: 0, count: 0 };
      byPayer[entry.payer].total += total;
      byPayer[entry.payer].count += 1;
    }

    const partnerPayers = ["BRUNO", "ROBERTO"];
    const partnersPaidTotal = partnerPayers.reduce((acc, payer) => acc + (byPayer[payer]?.total ?? 0), 0);
    const idealPerPartner = grandTotal / 2;

    return {
      jobSiteId,
      totals: {
        obra: bySource.OBRA?.total ?? 0,
        legal: bySource.LEGAL?.total ?? 0,
        labor: bySource.LABOR?.total ?? 0,
        grand: grandTotal,
      },
      bySource,
      byPayer,
      settlement: {
        bruno: {
          paid: byPayer.BRUNO?.total ?? 0,
          ideal: idealPerPartner,
          delta: (byPayer.BRUNO?.total ?? 0) - idealPerPartner,
        },
        roberto: {
          paid: byPayer.ROBERTO?.total ?? 0,
          ideal: idealPerPartner,
          delta: (byPayer.ROBERTO?.total ?? 0) - idealPerPartner,
        },
        partnersPaidTotal,
      },
      counts: {
        entries: entries.length,
      },
    };
  }
}
