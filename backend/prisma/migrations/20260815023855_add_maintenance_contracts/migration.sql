-- CreateEnum
CREATE TYPE "ContractFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL');

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "maintenanceContractId" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceContract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ContractFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3) NOT NULL,
    "lastGeneratedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT NOT NULL,
    "technicianId" TEXT,
    "addressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceContract_clientId_idx" ON "MaintenanceContract"("clientId");

-- CreateIndex
CREATE INDEX "MaintenanceContract_isActive_idx" ON "MaintenanceContract"("isActive");

-- CreateIndex
CREATE INDEX "MaintenanceContract_nextScheduledAt_idx" ON "MaintenanceContract"("nextScheduledAt");

-- AddForeignKey
ALTER TABLE "MaintenanceContract" ADD CONSTRAINT "MaintenanceContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceContract" ADD CONSTRAINT "MaintenanceContract_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceContract" ADD CONSTRAINT "MaintenanceContract_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_maintenanceContractId_fkey" FOREIGN KEY ("maintenanceContractId") REFERENCES "MaintenanceContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
