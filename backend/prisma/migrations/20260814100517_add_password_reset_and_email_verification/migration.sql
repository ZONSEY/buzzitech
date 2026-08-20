-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateTable
CREATE TABLE "Realisation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "clientName" TEXT,
    "location" TEXT,
    "completedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Realisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealisationImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "realisationId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealisationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realisation_slug_key" ON "Realisation"("slug");

-- CreateIndex
CREATE INDEX "Realisation_featured_idx" ON "Realisation"("featured");

-- CreateIndex
CREATE INDEX "Realisation_isActive_idx" ON "Realisation"("isActive");

-- CreateIndex
CREATE INDEX "Realisation_categoryId_idx" ON "Realisation"("categoryId");

-- CreateIndex
CREATE INDEX "Realisation_slug_idx" ON "Realisation"("slug");

-- CreateIndex
CREATE INDEX "RealisationImage_realisationId_idx" ON "RealisationImage"("realisationId");

-- AddForeignKey
ALTER TABLE "Realisation" ADD CONSTRAINT "Realisation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealisationImage" ADD CONSTRAINT "RealisationImage_realisationId_fkey" FOREIGN KEY ("realisationId") REFERENCES "Realisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
