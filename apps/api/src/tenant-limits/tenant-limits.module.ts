import { Module } from "@nestjs/common";
import { TenantLimitsService } from "./tenant-limits.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  providers: [TenantLimitsService, PrismaService],
  exports: [TenantLimitsService],
})
export class TenantLimitsModule {}
