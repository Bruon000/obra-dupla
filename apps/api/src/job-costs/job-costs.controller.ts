import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { JobCostsService } from "./job-costs.service";
import { ListJobCostsDto } from "./dto/list-job-costs.dto";
import { UpsertJobCostDto } from "./dto/upsert-job-cost.dto";

@Controller("job-costs")
export class JobCostsController {
  constructor(private readonly jobCostsService: JobCostsService) {}

  @Get()
  async list(@Query() query: ListJobCostsDto) {
    return this.jobCostsService.list(query);
  }

  @Get("summary")
  async summary(@Query("jobSiteId") jobSiteId: string) {
    return this.jobCostsService.summary(jobSiteId);
  }

  @Post()
  async create(@Body() dto: UpsertJobCostDto) {
    return this.jobCostsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpsertJobCostDto) {
    return this.jobCostsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.jobCostsService.remove(id);
  }
}
