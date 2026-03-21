import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from "@nestjs/common";
import { UpsertJobSiteDocumentDto } from "./dto/upsert-job-site-document.dto";
import { JobSiteDocumentsService } from "./job-site-documents.service";

@Controller("job-site-documents")
export class JobSiteDocumentsController {
  constructor(private readonly service: JobSiteDocumentsService) {}

  @Get()
  list(
    @Request() req: any,
    @Query("jobSiteId") jobSiteId: string,
    @Query("category") category?: string,
  ) {
    return this.service.list(req.user.companyId, jobSiteId, category);
  }

  /** Detalhe com fileDataBase64 (lista omite para não estourar memória no servidor). */
  @Get(":id")
  getOne(@Request() req: any, @Param("id") id: string) {
    return this.service.getById(req.user.companyId, id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: UpsertJobSiteDocumentDto) {
    return this.service.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(":id")
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpsertJobSiteDocumentDto) {
    return this.service.update(req.user.companyId, req.user.id, id, dto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.companyId, req.user.id, id);
  }
}

