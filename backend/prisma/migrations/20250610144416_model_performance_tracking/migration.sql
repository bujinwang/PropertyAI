-- CreateTable
CREATE TABLE "ModelPerformance" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT,
    "datasetInfo" TEXT,
    "parameters" JSONB,
    "notes" TEXT,

    CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelPerformance_modelName_idx" ON "ModelPerformance"("modelName");

-- CreateIndex
CREATE INDEX "ModelPerformance_recordedAt_idx" ON "ModelPerformance"("recordedAt");
