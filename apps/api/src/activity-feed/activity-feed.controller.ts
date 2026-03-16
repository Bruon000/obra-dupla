import { Controller, Get, Query, Request } from "@nestjs/common";
import { ActivityFeedService } from "./activity-feed.service";

@Controller("activity-feed")
export class ActivityFeedController {
  constructor(private readonly activityFeedService: ActivityFeedService) {}

  @Get()
  list(
    @Request() req: any,
    @Query("entityType") entityType: string,
    @Query("entityId") entityId: string,
  ) {
    return this.activityFeedService.listByEntity(
      req.user.companyId,
      entityType,
      entityId,
    );
  }
}
