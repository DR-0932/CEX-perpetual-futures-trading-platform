/*
  Warnings:

  - Added the required column `userId` to the `Collateral` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Collateral" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Collateral" ADD CONSTRAINT "Collateral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
