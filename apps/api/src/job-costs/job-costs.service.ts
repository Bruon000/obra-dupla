import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListJobCostsDto } from "./dto/list-job-costs.dto";
import { UpsertJobCostDto } from "./dto/upsert-job-cost.dto";

type SummaryBucket = {
  total: number;
  count: number;
};

@Injectable()
export class JobCostsService {
  constructor(private readonly prisma: PrismaService) {}

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
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(dto: UpsertJobCostDto) {
    return this.prisma.jobCostEntry.create({
      data: {
        companyId: dto.companyId,
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        description: dto.description,
        weekLabel: dto.weekLabel ?? null,
        quantity: dto.quantity ?? 1,
        unitPrice: dto.unitPrice ?? 0,
        total: dto.total,
        payer: dto.payer,
        supplier: dto.supplierName ?? null,
        invoiceNumber: dto.documentNumber ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        attachments: true,
      },
    });
  }

  async update(id: string, dto: UpsertJobCostDto) {
    const existing = await this.prisma.jobCostEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Lançamento de custo não encontrado.");

    return this.prisma.jobCostEntry.update({
      where: { id },
      data: {
        companyId: dto.companyId,
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        description: dto.description,
        weekLabel: dto.weekLabel ?? null,
        quantity: dto.quantity ?? 1,
        unitPrice: dto.unitPrice ?? 0,
        total: dto.total,
        payer: dto.payer,
        supplier: dto.supplierName ?? null,
        invoiceNumber: dto.documentNumber ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        attachments: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.jobCostEntry.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!existing) throw new NotFoundException("Lançamento de custo não encontrado.");

    await this.prisma.jobCostAttachment.deleteMany({
      where: { jobCostEntryId: id },
    });

    await this.prisma.jobCostEntry.delete({
      where: { id },
    });

    return { ok: true };
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
