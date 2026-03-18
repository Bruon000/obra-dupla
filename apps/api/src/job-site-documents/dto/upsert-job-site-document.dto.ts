import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export const JOB_SITE_DOCUMENT_STORAGE_TYPES = ["inline", "local", "remote"] as const;

export class UpsertJobSiteDocumentDto {
  @IsUUID()
  jobSiteId!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsIn(JOB_SITE_DOCUMENT_STORAGE_TYPES)
  storageType!: (typeof JOB_SITE_DOCUMENT_STORAGE_TYPES)[number];

  @IsOptional()
  @IsString()
  fileDataBase64?: string | null;

  @IsOptional()
  @IsString()
  thumbnailBase64?: string | null;

  @IsOptional()
  @IsString()
  fileUrl?: string | null;
}

