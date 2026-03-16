import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export const JOB_COST_ATTACHMENT_STORAGE_TYPES = ["inline", "local", "remote"] as const;

export class UpsertJobCostAttachmentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  companyId!: string;

  @IsUUID()
  jobCostEntryId!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsIn(JOB_COST_ATTACHMENT_STORAGE_TYPES)
  storageType!: (typeof JOB_COST_ATTACHMENT_STORAGE_TYPES)[number];

  @IsOptional()
  @IsString()
  fileDataBase64?: string | null;

  @IsOptional()
  @IsString()
  thumbnailBase64?: string | null;

  @IsOptional()
  @IsString()
  fileUrl?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
