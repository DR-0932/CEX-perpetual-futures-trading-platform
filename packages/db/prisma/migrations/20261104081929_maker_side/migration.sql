/*
  Warnings:

  - You are about to drop the column `markerSide` on the `Fill` table. All the data in the column will be lost.
  - Added the required column `makerSide` to the `Fill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fill" DROP COLUMN "markerSide",
ADD COLUMN     "makerSide" TEXT NOT NULL;
