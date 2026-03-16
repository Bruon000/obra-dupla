import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertJobCostAttachmentDto } from "./dto/upsert-job-cost-attachment.dto";

@Controller("job-cost-attachments")
export class JobCostAttachmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: UpsertJobCostAttachmentDto) {
    return this.prisma.jobCostAttachment.create({
      data: {
        companyId: dto.companyId,
        jobCostEntryId: dto.jobCostEntryId,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: dto.fileDataBase64 ?? null,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: dto.fileUrl ?? null,
      },
    });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpsertJobCostAttachmentDto) {
    return this.prisma.jobCostAttachment.update({
      where: { id },
      data: {
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        storageType: dto.storageType,
        fileDataBase64: dto.fileDataBase64 ?? null,
        thumbnailBase64: dto.thumbnailBase64 ?? null,
        fileUrl: dto.fileUrl ?? null,
      },
    });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.prisma.jobCostAttachment.delete({ where: { id } });
    return { ok: true };
  }
}
