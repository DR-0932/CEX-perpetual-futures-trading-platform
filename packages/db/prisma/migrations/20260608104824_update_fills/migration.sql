/*
  Warnings:

  - You are about to drop the column `PnL` on the `Fills` table. All the data in the column will be lost.
  - You are about to drop the column `market_id` on the `Fills` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `Fills` table. All the data in the column will be lost.
  - You are about to drop the column `side` on the `Fills` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Fills` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Fills` table. All the data in the column will be lost.
  - Added the required column `askLeverage` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `askMargin` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `askOrderId` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `askRole` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `askUserId` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bidLeverage` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bidMargin` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bidOrderId` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bidRole` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bidUserId` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `market` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingAskQty` to the `Fills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingBidQty` to the `Fills` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Fills" DROP CONSTRAINT "Fills_user_id_fkey";

-- AlterTable
ALTER TABLE "Fills" DROP COLUMN "PnL",
DROP COLUMN "market_id",
DROP COLUMN "order_id",
DROP COLUMN "side",
DROP COLUMN "type",
DROP COLUMN "user_id",
ADD COLUMN     "askLeverage" BIGINT NOT NULL,
ADD COLUMN     "askMargin" BIGINT NOT NULL,
ADD COLUMN     "askOrderId" TEXT NOT NULL,
ADD COLUMN     "askRole" TEXT NOT NULL,
ADD COLUMN     "askUserId" TEXT NOT NULL,
ADD COLUMN     "bidLeverage" BIGINT NOT NULL,
ADD COLUMN     "bidMargin" BIGINT NOT NULL,
ADD COLUMN     "bidOrderId" TEXT NOT NULL,
ADD COLUMN     "bidRole" TEXT NOT NULL,
ADD COLUMN     "bidUserId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "market" TEXT NOT NULL,
ADD COLUMN     "price" BIGINT NOT NULL,
ADD COLUMN     "remainingAskQty" BIGINT NOT NULL,
ADD COLUMN     "remainingBidQty" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_bidUserId_fkey" FOREIGN KEY ("bidUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_askUserId_fkey" FOREIGN KEY ("askUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
