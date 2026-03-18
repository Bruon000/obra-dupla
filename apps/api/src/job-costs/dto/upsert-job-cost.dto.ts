import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export const JOB_COST_SOURCES = ["OBRA", "LEGAL", "LABOR"] as const;
export const JOB_COST_PAYERS = ["BRUNO", "ROBERTO", "CAIXA", "OUTRO"] as const;

export class UpsertJobCostDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  jobSiteId!: string;

  @IsDateString()
  date!: string;

  @IsIn(JOB_COST_SOURCES)
  source!: (typeof JOB_COST_SOURCES)[number];

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  costType?: string | null;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  weekLabel?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsIn(JOB_COST_PAYERS)
  payer!: (typeof JOB_COST_PAYERS)[number];

  @IsOptional()
  @IsString()
  supplier?: string | null;

  @IsOptional()
  @IsString()
  invoiceNumber?: string | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
