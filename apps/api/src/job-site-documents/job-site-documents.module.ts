import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";
import { PrismaService } from "../prisma/prisma.service";
import { JobSiteDocumentsController } from "./job-site-documents.controller";
import { JobSiteDocumentsService } from "./job-site-documents.service";

@Module({
  imports: [ActivityFeedModule],
  controllers: [JobSiteDocumentsController],
  providers: [JobSiteDocumentsService, PrismaService],
})
export class JobSiteDocumentsModule {}

