import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";
import { AttachmentStorageService } from "../storage/attachment-storage.service";
import { UpsertJobCostAttachmentDto } from "./dto/upsert-job-cost-attachment.dto";

@Injectable()
export class JobCostAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
    private readonly storage: AttachmentStorageService,
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

  async create(companyId: string, userId: string, dto: UpsertJobCostAttachmentDto) {
    const jobCostEntry = await this.prisma.jobCostEntry.findFirst({
      where: { id: dto.jobCostEntryId, companyId, deletedAt: null },
      select: { payer: true, source: true, description: true, createdByUserId: true, totalAmount: true },
    });
    if (!jobCostEntry) throw new NotFoundException("Lançamento não encontrado para anexar.");

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && jobCostEntry.createdByUserId !== userId) {
      try {
        await this.activityFeed.create(companyId, userId, "JOB_COST_ATTACHMENT_CREATE_DENIED", "JobCostEntry", dto.jobCostEntryId, {
          targetCreatedByUserId: jobCostEntry.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_ATTACH",
        });
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode anexar em lançamentos que você mesmo criou.");
    }

    let fileUrlToSave = dto.fileUrl ?? null;
    let fileDataBase64ToSave: string | null = dto.fileDataBase64 ?? null;
    if (dto.fileDataBase64 && this.storage.isConfigured()) {
      const uploadedUrl = await this.storage.uploadBase64(
        companyId,
        "cost",
        dto.fileName,
        dto.mimeType,
        dto.fileDataBase64,
      );
      if (uploadedUrl) {
        fileUrlToSave = uploadedUrl;
        fileDataBase64ToSave = null;
      }
    }

    const created = await this.prisma.jobCostAttachment.create({
      data: {
        companyId,
        jobCostEntryId: dto.jobCostEntryId,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: fileDataBase64ToSave,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: fileUrlToSave,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_ATTACHMENT_CREATED",
      "JobCostEntry",
      created.jobCostEntryId,
      {
        jobCostEntryId: created.jobCostEntryId,
        fileName: created.fileName,
        mimeType: created.mimeType,
        description: jobCostEntry.description,
        payer: jobCostEntry.payer,
        source: jobCostEntry.source,
        totalAmount: jobCostEntry.totalAmount,
        permission: isAdmin ? "ADMIN_OVERRIDE" : "AUTHOR",
      },
    );

    return created;
  }

  async update(companyId: string, userId: string, id: string, dto: UpsertJobCostAttachmentDto) {
    const existing = await this.prisma.jobCostAttachment.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        jobCostEntryId: true,
        fileName: true,
        mimeType: true,
        jobCostEntry: {
          select: { payer: true, source: true, description: true, createdByUserId: true, totalAmount: true },
        },
        createdByUserId: true,
      },
    });
    if (!existing) throw new NotFoundException("Anexo não encontrado");

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.jobCostEntry.createdByUserId !== userId) {
      try {
        await this.activityFeed.create(companyId, userId, "JOB_COST_ATTACHMENT_UPDATE_DENIED", "JobCostEntry", existing.jobCostEntryId, {
          targetCreatedByUserId: existing.jobCostEntry.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_EDIT_ATTACHMENT",
        });
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode editar anexos em lançamentos que você mesmo criou.");
    }

    const before = {
      fileName: existing.fileName,
      mimeType: existing.mimeType,
      description: existing.jobCostEntry.description,
      payer: existing.jobCostEntry.payer,
      source: existing.jobCostEntry.source,
      totalAmount: existing.jobCostEntry.totalAmount,
    };

    let fileUrlToSave = dto.fileUrl ?? null;
    let fileDataBase64ToSave: string | null = dto.fileDataBase64 ?? null;
    if (dto.fileDataBase64 && this.storage.isConfigured()) {
      const uploadedUrl = await this.storage.uploadBase64(
        companyId,
        "cost",
        dto.fileName,
        dto.mimeType,
        dto.fileDataBase64,
        id,
      );
      if (uploadedUrl) {
        fileUrlToSave = uploadedUrl;
        fileDataBase64ToSave = null;
      }
    }

    const updated = await this.prisma.jobCostAttachment.update({
      where: { id },
      data: {
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: fileDataBase64ToSave,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: fileUrlToSave,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_ATTACHMENT_UPDATED",
      "JobCostEntry",
      updated.jobCostEntryId,
      {
        before,
        after: {
          fileName: updated.fileName,
          mimeType: updated.mimeType,
          description: before.description,
          payer: before.payer,
          source: before.source,
          totalAmount: before.totalAmount,
        },
        permission: isAdmin && existing.createdByUserId !== userId ? "ADMIN_OVERRIDE" : "AUTHOR",
        targetCreatedByUserId: existing.jobCostEntry.createdByUserId,
      },
    );

    return updated;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.prisma.jobCostAttachment.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        jobCostEntryId: true,
        fileName: true,
        mimeType: true,
        jobCostEntry: {
          select: { payer: true, source: true, description: true, createdByUserId: true, totalAmount: true },
        },
        createdByUserId: true,
      },
    });
    if (!existing) throw new NotFoundException("Anexo não encontrado");

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.jobCostEntry.createdByUserId !== userId) {
      try {
        await this.activityFeed.create(companyId, userId, "JOB_COST_ATTACHMENT_DELETE_DENIED", "JobCostEntry", existing.jobCostEntryId, {
          targetCreatedByUserId: existing.jobCostEntry.createdByUserId,
          reason: "NOT_AUTHORIZED_TO_DELETE_ATTACHMENT",
        });
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode remover anexos de lançamentos que você mesmo criou.");
    }

    const before = {
      fileName: existing.fileName,
      mimeType: existing.mimeType,
      description: existing.jobCostEntry.description,
      payer: existing.jobCostEntry.payer,
      source: existing.jobCostEntry.source,
      totalAmount: existing.jobCostEntry.totalAmount,
    };

    const deleted = await this.prisma.jobCostAttachment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByUserId: userId,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_ATTACHMENT_DELETED",
      "JobCostEntry",
      deleted.jobCostEntryId,
      {
        before,
        after: before,
        permission: isAdmin && existing.createdByUserId !== userId ? "ADMIN_OVERRIDE" : "AUTHOR",
        targetCreatedByUserId: existing.jobCostEntry.createdByUserId,
      },
    );

    return deleted;
  }
}
