-- Add sale breakdown fields to JobSite so "Venda" shows full data to all socios.
ALTER TABLE "JobSite" ADD COLUMN "commissionValue" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "JobSite" ADD COLUMN "taxValue" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "JobSite" ADD COLUMN "otherClosingCosts" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "JobSite" ADD COLUMN "soldAt" TIMESTAMP(3);
ALTER TABLE "JobSite" ADD COLUMN "saleNotes" TEXT NOT NULL DEFAULT '';

