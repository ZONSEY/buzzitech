-- AlterTable
ALTER TABLE "ProjectRequest" ADD COLUMN     "reference" TEXT;

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "projectRequestId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteLineItem_projectRequestId_idx" ON "QuoteLineItem"("projectRequestId");

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
