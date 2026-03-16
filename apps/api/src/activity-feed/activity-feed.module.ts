import { Module } from "@nestjs/common";
import { ActivityFeedController } from "./activity-feed.controller";
import { ActivityFeedService } from "./activity-feed.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [ActivityFeedController],
  providers: [ActivityFeedService, PrismaService],
  exports: [ActivityFeedService],
})
export class ActivityFeedModule {}
