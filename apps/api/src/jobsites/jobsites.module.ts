import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JobSitesController } from "./jobsites.controller";
import { JobSitesService } from "./jobsites.service";

@Module({
  controllers: [JobSitesController],
  providers: [JobSitesService, PrismaService],
})
export class JobSitesModule {}

