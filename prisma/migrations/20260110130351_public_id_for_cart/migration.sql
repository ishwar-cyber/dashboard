/*
  Warnings:

  - Added the required column `publicId` to the `CartItemImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItemImage" ADD COLUMN     "publicId" TEXT NOT NULL;
