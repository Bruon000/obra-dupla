import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
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

  private async getUserRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role ?? null;
  }

  private isAdmin(role: string | null): boolean {
    return role === "ADMIN";
  }

  private async getAllowedPayersForNonAdmin(companyId: string, jobSiteId: string, userId: string): Promise<string[]> {
    // Mantém coerência com o frontend atual:
    // - membro index 0 => "BRUNO"
    // - membro index 1 => "ROBERTO"
    // - demais => "OUTRO"
    const members = await this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId, deletedAt: null },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
      select: { userId: true },
    });

    const idx = members.findIndex((m) => m.userId === userId);
    if (idx < 0) {
      // Se o membro não estiver configurado, não faz sentido permitir atribuição de payer.
      throw new ForbiddenException("Participação da obra ainda não configurada para este usuário.");
    }

    let allowedPartnerPayer = "OUTRO";
    if (idx === 0) allowedPartnerPayer = "BRUNO";
    if (idx === 1) allowedPartnerPayer = "ROBERTO";

    // "CAIXA" é um payer de cenário/conta geral e não representa autoria por sócio.
    return Array.from(new Set([allowedPartnerPayer, "CAIXA"]));
  }

  async list(companyId: string, query: ListJobCostsDto) {
    // Por defeito NÃO incluir anexos (base64) — Render ~512MB: menos linhas + sem thumb base64 na lista.
    const includeAttachments =
      (query.includeAttachments as any) === true || (query.includeAttachments as any) === "true";
    const rows = await this.prisma.jobCostEntry.findMany({
      where: {
        companyId,
        jobSiteId: query.jobSiteId,
        deletedAt: null,
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
      take: includeAttachments ? 60 : 200,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        updatedByUser: { select: { id: true, name: true, email: true } },
        deletedByUser: { select: { id: true, name: true, email: true } },
        attachments: includeAttachments
          ? {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              // Nunca devolver base64 na lista — mesmo com includeAttachments=true
              // o front só precisa de metadados + fileUrl; comprovante completo via edição/detalhe.
              select: {
                id: true,
                companyId: true,
                jobCostEntryId: true,
                fileName: true,
                mimeType: true,
                storageType: true,
                fileUrl: true,
                /** Omitido na lista: miniaturas grandes ainda estouram RAM ao serializar JSON. */
                version: true,
                deviceId: true,
                lastSyncedAt: true,
                deletedAt: true,
                createdByUserId: true,
                updatedByUserId: true,
                deletedByUserId: true,
                createdAt: true,
                updatedAt: true,
                createdByUser: { select: { id: true, name: true, email: true } },
              },
            }
          : false,
      },
    });
    return rows;
  }

  async create(companyId: string, userId: string, dto: UpsertJobCostDto) {
    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin) {
      const allowedPayers = await this.getAllowedPayersForNonAdmin(companyId, dto.jobSiteId, userId);
      if (!allowedPayers.includes(dto.payer)) {
        await this.activityFeed.create(companyId, userId, "JOB_COST_CREATE_DENIED", "JobCostEntry", dto.jobSiteId, {
          reason: "NOT_AUTHORIZED_TO_SET_PAYER",
          allowedPayers,
          requestedPayer: dto.payer,
        });
        throw new ForbiddenException("Você só pode usar como pagador a sua própria participação.");
      }
    }

    const created = await this.prisma.jobCostEntry.create({
      data: {
        companyId,
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        costType: dto.costType ?? "Material",
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
          include: {
            createdByUser: { select: { id: true, name: true, email: true } },
          },
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
      select: {
        payer: true,
        id: true,
        jobSiteId: true,
        deletedAt: true,
        description: true,
        totalAmount: true,
        category: true,
        source: true,
        costType: true,
        createdByUserId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Lançamento não encontrado");
    }

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.createdByUserId !== userId) {
      // Mantém rastreabilidade mesmo em tentativas indevidas.
      try {
        await this.activityFeed.create(companyId, userId, "JOB_COST_EDIT_DENIED", "JobCostEntry", existing.id, {
          targetCreatedByUserId: existing.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_EDIT",
        });
      } catch {
        // não falhar a operação principal por causa do log de auditoria
      }
      throw new ForbiddenException("Você só pode editar lançamentos que você mesmo criou.");
    }

    if (!isAdmin) {
      const allowedPayers = await this.getAllowedPayersForNonAdmin(companyId, existing.jobSiteId, userId);
      if (!allowedPayers.includes(dto.payer)) {
        await this.activityFeed.create(companyId, userId, "JOB_COST_EDIT_DENIED", "JobCostEntry", existing.id, {
          targetCreatedByUserId: existing.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_SET_PAYER",
          allowedPayers,
          requestedPayer: dto.payer,
        });
        throw new ForbiddenException("Você só pode usar como pagador a sua própria participação.");
      }
    }

    const updated = await this.prisma.jobCostEntry.update({
      where: { id },
      data: {
        jobSiteId: dto.jobSiteId,
        date: new Date(dto.date),
        source: dto.source,
        category: dto.category,
        costType: dto.costType ?? existing.costType ?? "Material",
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
          include: {
            createdByUser: { select: { id: true, name: true, email: true } },
          },
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
        permission: isAdmin ? (existing.createdByUserId !== userId ? "ADMIN_OVERRIDE" : "ADMIN") : "AUTHOR",
        targetCreatedByUserId: existing.createdByUserId,
      },
    );

    return updated;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.prisma.jobCostEntry.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { payer: true, id: true, deletedAt: true, description: true, totalAmount: true, category: true, source: true, createdByUserId: true },
    });

    if (!existing) {
      throw new NotFoundException("Lançamento não encontrado");
    }

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.createdByUserId !== userId) {
      try {
        await this.activityFeed.create(companyId, userId, "JOB_COST_DELETE_DENIED", "JobCostEntry", existing.id, {
          targetCreatedByUserId: existing.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_DELETE",
        });
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode excluir lançamentos que você mesmo criou.");
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
          include: {
            createdByUser: { select: { id: true, name: true, email: true } },
          },
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
        permission: isAdmin ? (existing.createdByUserId !== userId ? "ADMIN_OVERRIDE" : "ADMIN") : "AUTHOR",
        targetCreatedByUserId: existing.createdByUserId,
      },
    );

    return deleted;
  }

  async summary(companyId: string, jobSiteId: string) {
    const entries = await this.prisma.jobCostEntry.findMany({
      where: {
        companyId,
        jobSiteId,
        deletedAt: null,
      },
      select: {
        id: true,
        source: true,
        payer: true,
        totalAmount: true,
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
      const total = Number(entry.totalAmount ?? 0);
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
