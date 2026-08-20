-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'PAYDUNYA', 'ORANGE_MONEY', 'WAVE');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_fkey";

-- DropIndex
DROP INDEX "Payment_transactionId_idx";

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "answered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripeIntentId",
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "gateway" "PaymentGateway" NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProjectRequest" ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estimatedCost" DECIMAL(10,2),
ADD COLUMN     "estimatedDuration" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "link" TEXT,
    "icon" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Audit_action_idx" ON "Audit"("action");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "BusinessService_featured_idx" ON "BusinessService"("featured");

-- CreateIndex
CREATE INDEX "BusinessService_status_idx" ON "BusinessService"("status");

-- CreateIndex
CREATE INDEX "BusinessService_categoryId_idx" ON "BusinessService"("categoryId");

-- CreateIndex
CREATE INDEX "BusinessService_price_idx" ON "BusinessService"("price");

-- CreateIndex
CREATE INDEX "BusinessServiceCategory_name_idx" ON "BusinessServiceCategory"("name");

-- CreateIndex
CREATE INDEX "BusinessServiceCategory_isActive_idx" ON "BusinessServiceCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessServiceCategory_name_key" ON "BusinessServiceCategory"("name");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_businessServiceId_idx" ON "CartItem"("businessServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_businessServiceId_key" ON "CartItem"("cartId", "businessServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_businessServiceId_idx" ON "OrderItem"("businessServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProjectRequest_userId_idx" ON "ProjectRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;