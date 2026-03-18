import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";
import { PrismaService } from "../prisma/prisma.service";
import { JobSiteMembersController } from "./job-site-members.controller";
import { JobSiteMembersService } from "./job-site-members.service";

@Module({
  imports: [ActivityFeedModule],
  controllers: [JobSiteMembersController],
  providers: [JobSiteMembersService, PrismaService],
  exports: [JobSiteMembersService],
})
export class JobSiteMembersModule {}

