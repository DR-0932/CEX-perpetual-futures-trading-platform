/*
  Warnings:

  - You are about to drop the column `Liquidation_price` on the `Positions` table. All the data in the column will be lost.
  - You are about to drop the column `inital_margin` on the `Positions` table. All the data in the column will be lost.
  - Added the required column `initial_margin` to the `Positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liquidation_price` to the `Positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Positions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `entry_price` on the `Positions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'LIQUIDATED';

-- AlterTable
ALTER TABLE "Positions" DROP COLUMN "Liquidation_price",
DROP COLUMN "inital_margin",
ADD COLUMN     "initial_margin" BIGINT NOT NULL,
ADD COLUMN     "liquidation_price" BIGINT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "entry_price",
ADD COLUMN     "entry_price" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Positions" ADD CONSTRAINT "Positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
