-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('MARKET', 'LIMIT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'CLOSED', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collateral" (
    "id" TEXT NOT NULL,
    "total" BIGINT NOT NULL,
    "available" BIGINT NOT NULL,
    "locked" BIGINT NOT NULL,

    CONSTRAINT "Collateral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "margin" BIGINT NOT NULL,
    "leverage" BIGINT NOT NULL,
    "side" "Side" NOT NULL,
    "type" "Type" NOT NULL,
    "quantity" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Positions" (
    "id" TEXT NOT NULL,
    "entry_price" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "inital_margin" BIGINT NOT NULL,
    "Liquidation_price" BIGINT NOT NULL,
    "leverage" BIGINT NOT NULL,
    "side" "Side" NOT NULL,
    "type" "Type" NOT NULL,
    "quantity" BIGINT NOT NULL,
    "status" "Status" NOT NULL,
    "PnL" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fills" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "market_id" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "type" "Type" NOT NULL,
    "quantity" BIGINT NOT NULL,
    "PnL" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Fills_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
