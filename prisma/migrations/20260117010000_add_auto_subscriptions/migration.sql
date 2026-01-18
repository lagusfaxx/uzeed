-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('INSTANT', 'AUTO_CHARGE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "kind" "PaymentKind" NOT NULL DEFAULT 'INSTANT';
ALTER TABLE "Payment" ADD COLUMN "subscription_id" TEXT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'khipu',
    "provider_subscription_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "max_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "next_charge_at" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_provider_subscription_id_key" ON "Subscription"("provider_subscription_id");

-- CreateIndex
CREATE INDEX "Subscription_user_id_idx" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "Payment_subscription_id_idx" ON "Payment"("subscription_id");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
