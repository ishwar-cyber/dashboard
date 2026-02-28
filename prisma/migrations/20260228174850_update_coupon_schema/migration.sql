/*
  Warnings:

  - The `applyTo` column on the `Coupon` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CouponApplyTo" AS ENUM ('ALL', 'PRODUCT', 'CATEGORY');

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "applyTo",
ADD COLUMN     "applyTo" "CouponApplyTo" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "CouponCategory" (
    "id" SERIAL NOT NULL,
    "couponId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CouponCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouponCategory_couponId_idx" ON "CouponCategory"("couponId");

-- CreateIndex
CREATE INDEX "CouponCategory_categoryId_idx" ON "CouponCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCategory_couponId_categoryId_key" ON "CouponCategory"("couponId", "categoryId");

-- CreateIndex
CREATE INDEX "Coupon_applyTo_idx" ON "Coupon"("applyTo");

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
