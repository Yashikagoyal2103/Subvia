-- DropForeignKey
ALTER TABLE "Plan" DROP CONSTRAINT "Plan_serviceId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "pendingPlanId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_pendingPlanId_idx" ON "Subscription"("pendingPlanId");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_pendingPlanId_fkey" FOREIGN KEY ("pendingPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
