import { Body, Controller, Get, Query, Patch, Request } from "@nestjs/common";
import { SetJobSiteMembersDto } from "./dto/set-job-site-members.dto";
import { JobSiteMembersService } from "./job-site-members.service";

@Controller("job-site-members")
export class JobSiteMembersController {
  constructor(private readonly service: JobSiteMembersService) {}

  @Get()
  list(@Request() req: any, @Query("jobSiteId") jobSiteId: string) {
    return this.service.list(req.user.companyId, jobSiteId);
  }

  @Patch()
  setMembers(@Request() req: any, @Body() dto: SetJobSiteMembersDto) {
    return this.service.setMembers(req.user.companyId, req.user.id, dto);
  }
}

