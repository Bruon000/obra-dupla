import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";
import { AttachmentStorageService } from "../storage/attachment-storage.service";
import { UpsertJobSiteDocumentDto } from "./dto/upsert-job-site-document.dto";

@Injectable()
export class JobSiteDocumentsService {
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

  async getById(companyId: string, id: string) {
    const doc = await this.prisma.jobSiteDocument.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!doc) throw new NotFoundException("Documento não encontrado.");
    return doc;
  }

  async list(companyId: string, jobSiteId: string, category?: string | null) {
    // Não devolver fileDataBase64 na lista — pode ser enorme e causar OOM no Node ao serializar JSON.
    // Miniatura e URL pública continuam (preview/download usam fileUrl ou thumbnail).
    return this.prisma.jobSiteDocument.findMany({
      where: {
        companyId,
        jobSiteId,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      omit: {
        fileDataBase64: true,
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(companyId: string, userId: string, dto: UpsertJobSiteDocumentDto) {
    const jobSite = await this.prisma.jobSite.findFirst({
      where: { companyId, id: dto.jobSiteId, deletedAt: null },
      select: { id: true },
    });
    if (!jobSite) throw new NotFoundException("Obra não encontrada.");

    if (!dto.fileDataBase64 && !dto.fileUrl) {
      throw new ForbiddenException("Informe `fileDataBase64` ou `fileUrl`.");
    }

    let fileUrlToSave = dto.fileUrl ?? null;
    let fileDataBase64ToSave: string | null = dto.fileDataBase64 ?? null;
    if (dto.fileDataBase64 && this.storage.isConfigured()) {
      const uploadedUrl = await this.storage.uploadBase64(
        companyId,
        "doc",
        dto.fileName,
        dto.mimeType,
        dto.fileDataBase64,
      );
      if (uploadedUrl) {
        fileUrlToSave = uploadedUrl;
        fileDataBase64ToSave = null;
      }
    }

    const created = await this.prisma.jobSiteDocument.create({
      data: {
        companyId,
        jobSiteId: dto.jobSiteId,
        category: dto.category,
        title: dto.title,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: fileDataBase64ToSave,
        fileUrl: fileUrlToSave,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        uploadedByUserId: userId,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    await this.activityFeed.create(companyId, userId, "JOB_SITE_DOCUMENT_CREATED", "JobSite", dto.jobSiteId, {
      documentId: created.id,
      category: created.category,
      title: created.title,
      fileName: created.fileName,
      mimeType: created.mimeType,
    });

    return created;
  }

  async update(companyId: string, userId: string, id: string, dto: UpsertJobSiteDocumentDto) {
    const existing = await this.prisma.jobSiteDocument.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        jobSiteId: true,
        uploadedByUserId: true,
        fileName: true,
        mimeType: true,
        category: true,
        title: true,
      },
    });
    if (!existing) throw new NotFoundException("Documento não encontrado.");

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.uploadedByUserId !== userId) {
      try {
        await this.activityFeed.create(
          companyId,
          userId,
          "JOB_SITE_DOCUMENT_UPDATE_DENIED",
          "JobSite",
          existing.jobSiteId,
          { documentId: existing.id, reason: "NOT_AUTHORIZED_TO_EDIT_DOCUMENT" },
        );
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode editar documentos que você enviou.");
    }

    const before = {
      fileName: existing.fileName,
      mimeType: existing.mimeType,
      category: existing.category,
      title: existing.title,
    };

    let fileUrlToSave = dto.fileUrl ?? null;
    let fileDataBase64ToSave: string | null = dto.fileDataBase64 ?? null;
    if (dto.fileDataBase64 && this.storage.isConfigured()) {
      const uploadedUrl = await this.storage.uploadBase64(
        companyId,
        "doc",
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

    const updated = await this.prisma.jobSiteDocument.update({
      where: { id },
      data: {
        category: dto.category,
        title: dto.title,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: fileDataBase64ToSave,
        fileUrl: fileUrlToSave,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
      },
    });

    await this.activityFeed.create(companyId, userId, "JOB_SITE_DOCUMENT_UPDATED", "JobSite", existing.jobSiteId, {
      documentId: updated.id,
      before,
      after: {
        fileName: updated.fileName,
        mimeType: updated.mimeType,
        category: updated.category,
        title: updated.title,
      },
      permission: isAdmin && existing.uploadedByUserId !== userId ? "ADMIN_OVERRIDE" : "AUTHOR",
    });

    return updated;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.prisma.jobSiteDocument.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, jobSiteId: true, uploadedByUserId: true, fileName: true, mimeType: true, category: true, title: true },
    });
    if (!existing) throw new NotFoundException("Documento não encontrado.");

    const role = await this.getUserRole(userId);
    const isAdmin = this.isAdmin(role);

    if (!isAdmin && existing.uploadedByUserId !== userId) {
      try {
        await this.activityFeed.create(
          companyId,
          userId,
          "JOB_SITE_DOCUMENT_DELETE_DENIED",
          "JobSite",
          existing.jobSiteId,
          { documentId: existing.id, reason: "NOT_AUTHORIZED_TO_DELETE_DOCUMENT" },
        );
      } catch {
        // best-effort
      }
      throw new ForbiddenException("Você só pode remover documentos que você enviou.");
    }

    const before = { fileName: existing.fileName, mimeType: existing.mimeType, category: existing.category, title: existing.title };

    const deleted = await this.prisma.jobSiteDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByUserId: userId,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
    });

    await this.activityFeed.create(companyId, userId, "JOB_SITE_DOCUMENT_DELETED", "JobSite", existing.jobSiteId, {
      documentId: deleted.id,
      before,
    });

    return deleted;
  }
}

