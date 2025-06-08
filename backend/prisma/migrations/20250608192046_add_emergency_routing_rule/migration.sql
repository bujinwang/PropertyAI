-- CreateTable
CREATE TABLE "EmergencyRoutingRule" (
    "id" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyRoutingRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmergencyRoutingRule" ADD CONSTRAINT "EmergencyRoutingRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaintenanceRequestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyRoutingRule" ADD CONSTRAINT "EmergencyRoutingRule_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
