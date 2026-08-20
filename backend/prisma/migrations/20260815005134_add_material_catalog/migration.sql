-- AlterTable
ALTER TABLE "InterventionMaterial" ADD COLUMN     "materialItemId" TEXT;

-- CreateTable
CREATE TABLE "MaterialItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialItem_name_key" ON "MaterialItem"("name");

-- CreateIndex
CREATE INDEX "MaterialItem_isActive_idx" ON "MaterialItem"("isActive");

-- AddForeignKey
ALTER TABLE "InterventionMaterial" ADD CONSTRAINT "InterventionMaterial_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "MaterialItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
