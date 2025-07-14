-- CreateTable
CREATE TABLE "MaintenanceResponseTime" (
    "id" TEXT NOT NULL,
    "maintenanceRequestId" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceResponseTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceResponseTime_maintenanceRequestId_key" ON "MaintenanceResponseTime"("maintenanceRequestId");

-- AddForeignKey
ALTER TABLE "MaintenanceResponseTime" ADD CONSTRAINT "MaintenanceResponseTime_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
