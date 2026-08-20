-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "InterventionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "observations" TEXT,
    "report" TEXT,
    "clientId" TEXT NOT NULL,
    "technicianId" TEXT,
    "addressId" TEXT,
    "addressText" TEXT,
    "orderItemId" TEXT,
    "projectRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionPhoto" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionMaterial" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_reference_key" ON "Intervention"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_orderItemId_key" ON "Intervention"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_projectRequestId_key" ON "Intervention"("projectRequestId");

-- CreateIndex
CREATE INDEX "Intervention_technicianId_idx" ON "Intervention"("technicianId");

-- CreateIndex
CREATE INDEX "Intervention_clientId_idx" ON "Intervention"("clientId");

-- CreateIndex
CREATE INDEX "Intervention_status_idx" ON "Intervention"("status");

-- CreateIndex
CREATE INDEX "Intervention_scheduledAt_idx" ON "Intervention"("scheduledAt");

-- CreateIndex
CREATE INDEX "InterventionPhoto_interventionId_idx" ON "InterventionPhoto"("interventionId");

-- CreateIndex
CREATE INDEX "InterventionMaterial_interventionId_idx" ON "InterventionMaterial"("interventionId");

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionPhoto" ADD CONSTRAINT "InterventionPhoto_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionMaterial" ADD CONSTRAINT "InterventionMaterial_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
