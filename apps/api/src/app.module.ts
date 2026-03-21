import { Module } from "@nestjs/common";
import { ActivityFeedModule } from "./activity-feed/activity-feed.module";
import { JobCostsModule } from "./job-costs/job-costs.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { JobSitesModule } from "./jobsites/jobsites.module";
import { JobSiteMembersModule } from "./job-site-members/job-site-members.module";
import { JobSiteDocumentsModule } from "./job-site-documents/job-site-documents.module";
import { SupportModule } from "./support/support.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { StorageModule } from "./storage/storage.module";
import { BillingModule } from "./billing/billing.module";

@Module({
  imports: [
    SupabaseModule,
    StorageModule,
    BillingModule,
    AuthModule,
    ActivityFeedModule,
    JobCostsModule,
    UsersModule,
    JobSitesModule,
    JobSiteMembersModule,
    JobSiteDocumentsModule,
    SupportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
