-- CreateTable
CREATE TABLE "VendorPerformanceRating" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comments" TEXT,
    "ratedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPerformanceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "scaleType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetric_name_key" ON "PerformanceMetric"("name");

-- AddForeignKey
ALTER TABLE "VendorPerformanceRating" ADD CONSTRAINT "VendorPerformanceRating_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
