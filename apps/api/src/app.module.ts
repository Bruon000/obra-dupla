import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "./activity-feed/activity-feed.module";
import { JobCostsModule } from "./job-costs/job-costs.module";

@Module({
  imports: [ActivityFeedModule, JobCostsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
