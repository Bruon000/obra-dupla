import { Type } from "class-transformer";
import {
  IsArray,
  IsDecimal,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

const SHARE_MIN = 0;
const SHARE_MAX = 100;

export class JobSiteMemberInputDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Min(SHARE_MIN)
  @Max(SHARE_MAX)
  sharePercent!: number;

  // Ordem visual/operacional dentro da obra.
  @IsInt()
  @Min(0)
  sortIndex!: number;
}

export class SetJobSiteMembersDto {
  @IsUUID()
  jobSiteId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSiteMemberInputDto)
  members!: JobSiteMemberInputDto[];
}

