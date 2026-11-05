/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Collateral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Positions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collateral" DROP CONSTRAINT "Collateral_userId_fkey";

-- DropForeignKey
ALTER TABLE "Fills" DROP CONSTRAINT "Fills_askUserId_fkey";

-- DropForeignKey
ALTER TABLE "Fills" DROP CONSTRAINT "Fills_bidUserId_fkey";

-- DropForeignKey
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Positions" DROP CONSTRAINT "Positions_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "name";

-- DropTable
DROP TABLE "Collateral";

-- DropTable
DROP TABLE "Fills";

-- DropTable
DROP TABLE "Orders";

-- DropTable
DROP TABLE "Positions";

-- DropEnum
DROP TYPE "Side";

-- DropEnum
DROP TYPE "Status";

-- DropEnum
DROP TYPE "Type";

-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "available" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "locked" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "filledQty" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "avgFillPrice" DECIMAL(20,8),
    "status" TEXT NOT NULL,
    "leverage" INTEGER,
    "reduceOnly" BOOLEAN NOT NULL DEFAULT false,
    "exchange" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fill" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "markerSide" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "entryPrice" DECIMAL(20,8) NOT NULL,
    "liquidationPrice" DECIMAL(20,8) NOT NULL,
    "margin" DECIMAL(20,8) NOT NULL,
    "leverage" INTEGER NOT NULL,
    "realizedPnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderbookSnapshot" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "bids" JSONB NOT NULL,
    "asks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderbookSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceFundEvent" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceFundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingRate" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "markPrice" DECIMAL(20,8) NOT NULL,
    "indexPrice" DECIMAL(65,30) NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "positionSide" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "fundingRateId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineSnapshot" (
    "id" TEXT NOT NULL,
    "walCursor" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Balance_userId_asset_key" ON "Balance"("userId", "asset");

-- CreateIndex
CREATE INDEX "Position_userId_market_idx" ON "Position"("userId", "market");

-- CreateIndex
CREATE INDEX "OrderbookSnapshot_market_createdAt_idx" ON "OrderbookSnapshot"("market", "createdAt");

-- CreateIndex
CREATE INDEX "InsuranceFundEvent_market_createdAt_idx" ON "InsuranceFundEvent"("market", "createdAt");

-- CreateIndex
CREATE INDEX "FundingRate_market_settledAt_idx" ON "FundingRate"("market", "settledAt");

-- CreateIndex
CREATE INDEX "FundingPayment_userId_market_idx" ON "FundingPayment"("userId", "market");

-- CreateIndex
CREATE INDEX "EngineSnapshot_createdAt_idx" ON "EngineSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingPayment" ADD CONSTRAINT "FundingPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingPayment" ADD CONSTRAINT "FundingPayment_fundingRateId_fkey" FOREIGN KEY ("fundingRateId") REFERENCES "FundingRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
