import { Body, Controller, Delete, Param, Patch, Post, Request } from "@nestjs/common";
import { UpsertJobCostAttachmentDto } from "./dto/upsert-job-cost-attachment.dto";
import { JobCostAttachmentsService } from "./job-cost-attachments.service";

@Controller("job-cost-attachments")
export class JobCostAttachmentsController {
  constructor(private readonly service: JobCostAttachmentsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: UpsertJobCostAttachmentDto) {
    return this.service.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(":id")
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpsertJobCostAttachmentDto) {
    return this.service.update(req.user.companyId, req.user.id, id, dto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.companyId, req.user.id, id);
  }
}
