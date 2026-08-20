-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "serialNumber" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warrantyUntil" TIMESTAMP(3),
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "addressId" TEXT,
    "interventionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Equipment_clientId_idx" ON "Equipment"("clientId");

-- CreateIndex
CREATE INDEX "Equipment_interventionId_idx" ON "Equipment"("interventionId");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
