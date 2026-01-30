/*
  Warnings:

  - The `paymentMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentStatus` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderStatus` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `name` on the `OrderItem` table. All the data in the column will be lost.
  - Made the column `fullName` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `line1` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pincode` on table `OrderAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quantity` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `sequence` to the `OrderTracking` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `stepKey` on the `OrderTracking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'CARD', 'UPI', 'ONLINE', 'NETBANKING', 'WALLET');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED');

-- DropIndex
DROP INDEX "OrderTracking_completed_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "totalMrp" DOUBLE PRECISION,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE',
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "orderStatus",
ADD COLUMN     "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PLCACED';

-- AlterTable
ALTER TABLE "OrderAddress" ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "line1" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "pincode" SET NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'india';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "name",
ADD COLUMN     "productName" TEXT,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "quantity" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderRefund" ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'INITIATED',
ALTER COLUMN "amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrderTracking" ADD COLUMN     "sequence" INTEGER NOT NULL,
DROP COLUMN "stepKey",
ADD COLUMN     "stepKey" "OrderStatus" NOT NULL;

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderReturn" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OrderReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderPayment_orderId_key" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderReturn_orderId_key" ON "OrderReturn"("orderId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "OrderTracking_sequence_idx" ON "OrderTracking"("sequence");

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
