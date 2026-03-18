import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobSiteDto } from "./dto/create-jobsite.dto";
import { UpdateJobSiteDto } from "./dto/update-jobsite.dto";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  // aceita YYYY-MM-DD
  const iso = `${value}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class JobSitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
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

  list(companyId: string) {
    return this.prisma.jobSite.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(companyId: string, id: string) {
    const found = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!found) throw new NotFoundException("Obra não encontrada");
    return found;
  }

  create(companyId: string, dto: CreateJobSiteDto) {
    return this.prisma.jobSite.create({
      data: {
        companyId,
        title: dto.title,
        address: dto.address ?? "",
        notes: dto.notes ?? "",
        status: dto.status ?? "EM_ANDAMENTO",
        startDate: parseDateOnly(dto.startDate),
        endDate: parseDateOnly(dto.endDate),
        saleValue: dto.saleValue ?? 0,
      },
    });
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
      },
    });

    return updated;
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

    return deleted;
  }
}

