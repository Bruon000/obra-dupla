import { Module } from "@nestjs/common";
import { JobCostsController } from "./job-costs.controller";
import { JobCostAttachmentsController } from "./job-cost-attachments.controller";
import { JobCostsService } from "./job-costs.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [JobCostsController, JobCostAttachmentsController],
  providers: [JobCostsService, PrismaService],
  exports: [JobCostsService],
})
export class JobCostsModule {}
