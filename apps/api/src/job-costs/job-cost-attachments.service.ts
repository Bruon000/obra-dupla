import { Injectable, NotFoundException } from "@nestjs/common";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertJobCostAttachmentDto } from "./dto/upsert-job-cost-attachment.dto";

@Injectable()
export class JobCostAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  async create(companyId: string, userId: string, dto: UpsertJobCostAttachmentDto) {
    const created = await this.prisma.jobCostAttachment.create({
      data: {
        companyId,
        jobCostEntryId: dto.jobCostEntryId,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: dto.fileDataBase64 ?? null,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: dto.fileUrl ?? null,
        createdByUserId: userId,
        updatedByUserId: userId,
      },
    });

    await this.activityFeed.create(
      companyId,
      userId,
      "JOB_COST_ATTACHMENT_CREATED",
      "JobCostAttachment",
      created.id,
      {
        jobCostEntryId: created.jobCostEntryId,
        fileName: created.fileName,
        mimeType: created.mimeType,
      },
    );

    return created;
  }

  async update(companyId: string, userId: string, id: string, dto: UpsertJobCostAttachmentDto) {
    const existing = await this.prisma.jobCostAttachment.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Anexo não encontrado");

    return this.prisma.jobCostAttachment.update({
      where: { id },
      data: {
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: dto.fileDataBase64 ?? null,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: dto.fileUrl ?? null,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
    });
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.prisma.jobCostAttachment.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Anexo não encontrado");

    return this.prisma.jobCostAttachment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByUserId: userId,
        updatedByUserId: userId,
        version: { increment: 1 },
      },
    });
  }
}
