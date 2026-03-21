import { IsBooleanString, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { JOB_COST_PAYERS, JOB_COST_SOURCES } from "./upsert-job-cost.dto";

export class ListJobCostsDto {
  @IsUUID()
  jobSiteId!: string;

  @IsOptional()
  @IsIn(JOB_COST_SOURCES)
  source?: (typeof JOB_COST_SOURCES)[number];

  @IsOptional()
  @IsIn(JOB_COST_PAYERS)
  payer?: (typeof JOB_COST_PAYERS)[number];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsBooleanString()
  includeAttachments?: boolean;
}
