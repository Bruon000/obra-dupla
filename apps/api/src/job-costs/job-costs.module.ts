import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";
import { JobCostAttachmentsController } from "./job-cost-attachments.controller";
import { JobCostAttachmentsService } from "./job-cost-attachments.service";
import { JobCostsController } from "./job-costs.controller";
import { JobCostsService } from "./job-costs.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  imports: [ActivityFeedModule],
  controllers: [JobCostsController, JobCostAttachmentsController],
  providers: [JobCostsService, JobCostAttachmentsService, PrismaService],
  exports: [JobCostsService],
})
export class JobCostsModule {}
