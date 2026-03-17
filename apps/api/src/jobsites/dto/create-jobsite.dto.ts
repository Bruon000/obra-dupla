import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

const STATUSES = ["EM_ANDAMENTO", "VENDIDA", "PAUSADA"] as const;

export class CreateJobSiteDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  /** YYYY-MM-DD */
  @IsOptional()
  @IsString()
  startDate?: string | null;

  /** YYYY-MM-DD */
  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  saleValue?: number;
}

