import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from "@nestjs/common";
import { JobSitesService } from "./jobsites.service";
import { CreateJobSiteDto } from "./dto/create-jobsite.dto";
import { UpdateJobSiteDto } from "./dto/update-jobsite.dto";

@Controller("jobsites")
export class JobSitesController {
  constructor(private readonly service: JobSitesService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.companyId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateJobSiteDto) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get(":id")
  get(@Request() req: any, @Param("id") id: string) {
    return this.service.get(req.user.companyId, id);
  }

  @Patch(":id")
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpdateJobSiteDto) {
    return this.service.update(req.user.companyId, id, dto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.companyId, id);
  }
}

