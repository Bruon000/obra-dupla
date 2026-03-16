import { Module } from "@nestjs/common";
import { ActivityFeedService } from "./activity-feed.service";

@Module({
  providers: [ActivityFeedService],
  exports: [ActivityFeedService],
})
export class ActivityFeedModule {}
