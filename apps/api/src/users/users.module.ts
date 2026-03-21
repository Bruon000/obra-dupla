import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";
import { TenantLimitsModule } from "../tenant-limits/tenant-limits.module";

@Module({
  imports: [ActivityFeedModule, TenantLimitsModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
