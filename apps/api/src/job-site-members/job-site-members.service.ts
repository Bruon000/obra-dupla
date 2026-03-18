import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";
import { SetJobSiteMembersDto } from "./dto/set-job-site-members.dto";

@Injectable()
export class JobSiteMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  async list(companyId: string, jobSiteId: string) {
    return this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId, deletedAt: null },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        companyId: true,
        jobSiteId: true,
        userId: true,
        name: true,
        sharePercent: true,
        sortIndex: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== "ADMIN") {
      throw new ForbiddenException("Apenas admin pode alterar participação.");
    }
  }

  async setMembers(companyId: string, actorUserId: string, dto: SetJobSiteMembersDto) {
    await this.assertAdmin(actorUserId);

    const jobSite = await this.prisma.jobSite.findFirst({
      where: { companyId, id: dto.jobSiteId, deletedAt: null },
      select: { id: true },
    });
    if (!jobSite) throw new NotFoundException("Obra não encontrada.");

    if (!dto.members?.length) throw new ForbiddenException("Informe ao menos um sócio.");

    const incoming = dto.members.map((m) => ({
      userId: m.userId,
      name: (m.name ?? "").trim(),
      sharePercent: Number(m.sharePercent),
      sortIndex: Number(m.sortIndex),
    }));

    const sum = incoming.reduce((acc, m) => acc + (Number.isFinite(m.sharePercent) ? m.sharePercent : 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new ForbiddenException(`A participação deve somar 100%. Atual: ${sum.toFixed(1)}%`);
    }

    // Valida pertencimento à company e também evita userId duplicado.
    const uniqueUserIds = new Set(incoming.map((m) => m.userId));
    if (uniqueUserIds.size !== incoming.length) {
      throw new ForbiddenException("Há sócios duplicados na configuração.");
    }

    const users = await this.prisma.user.findMany({
      where: { companyId, id: { in: incoming.map((m) => m.userId) } },
      select: { id: true, name: true },
    });
    const usersById = new Map(users.map((u) => [u.id, u]));
    for (const m of incoming) {
      if (!usersById.has(m.userId)) {
        throw new ForbiddenException("Um dos sócios não pertence à sua empresa.");
      }
    }

    const before = await this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId: dto.jobSiteId, deletedAt: null },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
      select: { userId: true, name: true, sharePercent: true, sortIndex: true, id: true },
    });

    const now = new Date();

    // Aplica update/insert por userId.
    const updatedUserIds = incoming.map((m) => m.userId);
    const existing = await this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId: dto.jobSiteId, deletedAt: null, userId: { in: updatedUserIds } },
      select: { id: true, userId: true, sharePercent: true, sortIndex: true, name: true },
    });
    const existingByUserId = new Map(existing.map((m) => [m.userId, m]));

    // Mantém snapshot "name" caso o frontend não envie.
    const prepared = incoming.map((m) => ({
      userId: m.userId,
      name: m.name || usersById.get(m.userId)!.name,
      sharePercent: m.sharePercent,
      sortIndex: m.sortIndex,
    }));

    // Atualiza os que já existem.
    for (const m of prepared) {
      const ex = existingByUserId.get(m.userId);
      if (!ex) continue;
      await this.prisma.jobSiteMember.update({
        where: { id: ex.id },
        data: {
          name: m.name,
          sharePercent: new Prisma.Decimal(m.sharePercent),
          sortIndex: m.sortIndex,
          updatedByUserId: actorUserId,
          version: { increment: 1 },
        },
      });
    }

    // Cria os que não existem.
    const toCreate = prepared.filter((m) => !existingByUserId.has(m.userId));
    if (toCreate.length) {
      await this.prisma.jobSiteMember.createMany({
        data: toCreate.map((m) => ({
          companyId,
          jobSiteId: dto.jobSiteId,
          userId: m.userId,
          name: m.name,
          sharePercent: new Prisma.Decimal(m.sharePercent),
          sortIndex: m.sortIndex,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        })),
      });
    }

    // Soft-delete (removidos do input).
    const removed = await this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId: dto.jobSiteId, deletedAt: null },
      select: { id: true, userId: true },
    });
    const removedIds = removed.filter((r) => !uniqueUserIds.has(r.userId)).map((r) => r.id);
    if (removedIds.length) {
      await this.prisma.jobSiteMember.updateMany({
        where: { id: { in: removedIds } },
        data: { deletedAt: now, deletedByUserId: actorUserId, updatedByUserId: actorUserId },
      });
    }

    const after = await this.prisma.jobSiteMember.findMany({
      where: { companyId, jobSiteId: dto.jobSiteId, deletedAt: null },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
      select: { userId: true, name: true, sharePercent: true, sortIndex: true, id: true },
    });

    await this.activityFeed.create(companyId, actorUserId, "PARTICIPATION_UPDATED", "JobSite", dto.jobSiteId, {
      before: before.map((m) => ({ userId: m.userId, name: m.name, sharePercent: m.sharePercent, sortIndex: m.sortIndex })),
      after: after.map((m) => ({ userId: m.userId, name: m.name, sharePercent: m.sharePercent, sortIndex: m.sortIndex })),
      delta: after.map((m) => {
        const b = before.find((x) => x.userId === m.userId);
        return { userId: m.userId, before: b?.sharePercent ?? null, after: m.sharePercent };
      }),
    });

    return this.list(companyId, dto.jobSiteId);
  }
}

