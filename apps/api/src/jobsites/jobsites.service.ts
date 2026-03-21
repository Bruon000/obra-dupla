import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobSiteDto } from "./dto/create-jobsite.dto";
import { UpdateJobSiteDto } from "./dto/update-jobsite.dto";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { TenantLimitsService } from "../tenant-limits/tenant-limits.service";
import { jobSiteToJson } from "./job-site-json.util";

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  // aceita YYYY-MM-DD
  const iso = `${value}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class JobSitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
    private readonly tenantLimits: TenantLimitsService,
  ) {}

  private async getUserRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role ?? null;
  }

  private async ensureAdminOrDeny(companyId: string, actorUserId: string, eventType: string, entityId: string) {
    const role = await this.getUserRole(actorUserId);
    if (role === "ADMIN") return;

    // Auditoria de tentativas negadas (forense).
    try {
      await this.activityFeed.create(companyId, actorUserId, eventType, "JobSite", entityId, {
        reason: "NOT_AUTHORIZED_TO_EDIT_JOB_SITE",
        actorRole: role,
      });
    } catch {
      // best-effort
    }

    throw new ForbiddenException("Apenas admin pode editar a obra.");
  }

  async list(companyId: string) {
    const rows = await this.prisma.jobSite.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return rows.map((r) => jobSiteToJson(r as unknown as Record<string, unknown>));
  }

  async get(companyId: string, id: string) {
    const found = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!found) throw new NotFoundException("Obra não encontrada");
    return jobSiteToJson(found as unknown as Record<string, unknown>);
  }

  async create(companyId: string, dto: CreateJobSiteDto) {
    await this.tenantLimits.assertCanCreateJobSite(companyId);
    const created = await this.prisma.jobSite.create({
      data: {
        companyId,
        title: dto.title,
        address: dto.address ?? "",
        notes: dto.notes ?? "",
        status: dto.status ?? "EM_ANDAMENTO",
        startDate: parseDateOnly(dto.startDate),
        endDate: parseDateOnly(dto.endDate),
        saleValue: dto.saleValue ?? 0,
        commissionValue: dto.commissionValue ?? 0,
        taxValue: dto.taxValue ?? 0,
        otherClosingCosts: dto.otherClosingCosts ?? 0,
        soldAt: parseDateTime(dto.soldAt),
        saleNotes: dto.saleNotes ?? "",
      },
    });
    return jobSiteToJson(created as unknown as Record<string, unknown>);
  }

  async update(companyId: string, userId: string, id: string, dto: UpdateJobSiteDto) {
    await this.ensureAdminOrDeny(companyId, userId, "JOB_SITE_EDIT_DENIED", id);
    const existing = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Obra não encontrada");

    const before = {
      title: existing.title,
      address: existing.address,
      notes: existing.notes,
      status: existing.status,
      startDate: existing.startDate,
      endDate: existing.endDate,
      saleValue: existing.saleValue,
      commissionValue: (existing as any).commissionValue,
      taxValue: (existing as any).taxValue,
      otherClosingCosts: (existing as any).otherClosingCosts,
      soldAt: (existing as any).soldAt,
      saleNotes: (existing as any).saleNotes,
    };

    const updated = await this.prisma.jobSite.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.address !== undefined ? { address: dto.address ?? "" } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? "" } : {}),
        ...(dto.status !== undefined ? { status: dto.status ?? "EM_ANDAMENTO" } : {}),
        ...(dto.startDate !== undefined ? { startDate: parseDateOnly(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: parseDateOnly(dto.endDate) } : {}),
        ...(dto.saleValue !== undefined ? { saleValue: dto.saleValue ?? 0 } : {}),
        ...(dto.commissionValue !== undefined ? { commissionValue: dto.commissionValue ?? 0 } : {}),
        ...(dto.taxValue !== undefined ? { taxValue: dto.taxValue ?? 0 } : {}),
        ...(dto.otherClosingCosts !== undefined ? { otherClosingCosts: dto.otherClosingCosts ?? 0 } : {}),
        ...(dto.soldAt !== undefined ? { soldAt: parseDateTime(dto.soldAt) } : {}),
        ...(dto.saleNotes !== undefined ? { saleNotes: dto.saleNotes ?? "" } : {}),
      },
    });

    await this.activityFeed.create(companyId, userId, "JOB_SITE_UPDATED", "JobSite", updated.id, {
      before,
      after: {
        title: updated.title,
        address: updated.address,
        notes: updated.notes,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate,
        saleValue: updated.saleValue,
        commissionValue: (updated as any).commissionValue,
        taxValue: (updated as any).taxValue,
        otherClosingCosts: (updated as any).otherClosingCosts,
        soldAt: (updated as any).soldAt,
        saleNotes: (updated as any).saleNotes,
      },
    });

    return jobSiteToJson(updated as unknown as Record<string, unknown>);
  }

  async remove(companyId: string, userId: string, id: string) {
    await this.ensureAdminOrDeny(companyId, userId, "JOB_SITE_DELETE_DENIED", id);
    const existing = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Obra não encontrada");

    const deleted = await this.prisma.jobSite.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityFeed.create(companyId, userId, "JOB_SITE_DELETED", "JobSite", deleted.id, {
      before: { title: existing.title, saleValue: existing.saleValue },
    });

    return jobSiteToJson(deleted as unknown as Record<string, unknown>);
  }
}

