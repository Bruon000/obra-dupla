import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from "@nestjs/common";
import { JobCostsService } from "./job-costs.service";
import { ListJobCostsDto } from "./dto/list-job-costs.dto";
import { UpsertJobCostDto } from "./dto/upsert-job-cost.dto";

@Controller("job-costs")
export class JobCostsController {
  constructor(private readonly jobCostsService: JobCostsService) {}

  @Get()
  async list(@Request() req: any, @Query() query: ListJobCostsDto) {
    return this.jobCostsService.list(req.user.companyId, query);
  }

  @Get("summary")
  async summary(@Request() req: any, @Query("jobSiteId") jobSiteId: string) {
    return this.jobCostsService.summary(req.user.companyId, jobSiteId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: UpsertJobCostDto) {
    return this.jobCostsService.create(req.user.companyId, req.user.id, dto);
  }

  @Patch(":id")
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpsertJobCostDto) {
    return this.jobCostsService.update(req.user.companyId, req.user.id, id, dto);
  }

  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.jobCostsService.remove(req.user.companyId, req.user.id, id);
  }
}
