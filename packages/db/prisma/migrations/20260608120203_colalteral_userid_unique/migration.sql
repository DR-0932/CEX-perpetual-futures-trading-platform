/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Collateral` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Collateral_userId_key" ON "Collateral"("userId");
