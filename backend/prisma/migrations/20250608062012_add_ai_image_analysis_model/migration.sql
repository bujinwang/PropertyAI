-- CreateTable
CREATE TABLE "AIImageAnalysis" (
    "id" TEXT NOT NULL,
    "imageId" INTEGER NOT NULL,
    "tags" TEXT[],
    "description" TEXT,
    "objects" JSONB,
    "colors" JSONB,
    "quality" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIImageAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIImageAnalysis_imageId_key" ON "AIImageAnalysis"("imageId");

-- AddForeignKey
ALTER TABLE "AIImageAnalysis" ADD CONSTRAINT "AIImageAnalysis_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ListingImage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
