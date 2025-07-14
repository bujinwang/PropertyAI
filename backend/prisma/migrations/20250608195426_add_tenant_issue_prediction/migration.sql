-- CreateTable
CREATE TABLE "TenantIssuePrediction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIssuePrediction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TenantIssuePrediction" ADD CONSTRAINT "TenantIssuePrediction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
