import { Module } from "@nestjs/common";
import { JobCostsModule } from "./job-costs/job-costs.module";

@Module({
  imports: [JobCostsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
