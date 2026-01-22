/*
  Warnings:

  - You are about to drop the column `discount` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the `CartItemImage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CartItemImage" DROP CONSTRAINT "CartItemImage_cartItemId_fkey";

-- DropIndex
DROP INDEX "CartItem_cartId_idx";

-- DropIndex
DROP INDEX "CartItem_productId_idx";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "discount",
DROP COLUMN "name",
DROP COLUMN "price";

-- DropTable
DROP TABLE "CartItemImage";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");
