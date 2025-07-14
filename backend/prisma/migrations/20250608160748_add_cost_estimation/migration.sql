-- CreateTable
CREATE TABLE "CostEstimation" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostEstimation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CostEstimation_workOrderId_key" ON "CostEstimation"("workOrderId");

-- AddForeignKey
ALTER TABLE "CostEstimation" ADD CONSTRAINT "CostEstimation_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
