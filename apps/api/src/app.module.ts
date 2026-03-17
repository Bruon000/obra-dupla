import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "./activity-feed/activity-feed.module";
import { JobCostsModule } from "./job-costs/job-costs.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { JobSitesModule } from "./jobsites/jobsites.module";

@Module({
  imports: [AuthModule, ActivityFeedModule, JobCostsModule, UsersModule, JobSitesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
