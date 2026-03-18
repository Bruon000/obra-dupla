-- CreateTable
CREATE TABLE "JobSiteMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobSiteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sharePercent" DECIMAL(6,2) NOT NULL,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "deletedByUserId" TEXT,

    CONSTRAINT "JobSiteMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSiteDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobSiteId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "fileDataBase64" TEXT,
    "fileUrl" TEXT,
    "thumbnailBase64" TEXT,
    "uploadedByUserId" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "deletedByUserId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deviceId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSiteDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobSiteMember_companyId_jobSiteId_deletedAt_sortIndex_idx" ON "JobSiteMember"("companyId", "jobSiteId", "deletedAt", "sortIndex");

-- CreateIndex
CREATE INDEX "JobSiteMember_companyId_userId_deletedAt_idx" ON "JobSiteMember"("companyId", "userId", "deletedAt");

-- CreateIndex
CREATE INDEX "JobSiteDocument_companyId_jobSiteId_deletedAt_createdAt_idx" ON "JobSiteDocument"("companyId", "jobSiteId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "JobSiteDocument_companyId_uploadedByUserId_idx" ON "JobSiteDocument"("companyId", "uploadedByUserId");

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "JobSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteMember" ADD CONSTRAINT "JobSiteMember_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteDocument" ADD CONSTRAINT "JobSiteDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteDocument" ADD CONSTRAINT "JobSiteDocument_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "JobSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteDocument" ADD CONSTRAINT "JobSiteDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteDocument" ADD CONSTRAINT "JobSiteDocument_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSiteDocument" ADD CONSTRAINT "JobSiteDocument_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

