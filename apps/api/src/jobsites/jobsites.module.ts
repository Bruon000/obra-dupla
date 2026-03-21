import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JobSitesController } from "./jobsites.controller";
import { JobSitesService } from "./jobsites.service";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";
import { TenantLimitsModule } from "../tenant-limits/tenant-limits.module";

@Module({
  imports: [ActivityFeedModule, TenantLimitsModule],
  controllers: [JobSitesController],
  providers: [JobSitesService, PrismaService],
})
export class JobSitesModule {}

