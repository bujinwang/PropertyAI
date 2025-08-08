-- Migration: Add sentiment analytics fields to Message model
-- Created: 2025-01-09

-- Add sentiment analytics fields to Message table
ALTER TABLE "Message" 
ADD COLUMN "sentiment" "Sentiment" DEFAULT 'NEUTRAL',
ADD COLUMN "sentimentScore" DOUBLE PRECISION,
ADD COLUMN "category" TEXT,
ADD COLUMN "isEarlyWarning" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX "Message_sentiment_idx" ON "Message"("sentiment");
CREATE INDEX "Message_category_idx" ON "Message"("category");
CREATE INDEX "Message_isEarlyWarning_idx" ON "Message"("isEarlyWarning");
CREATE INDEX "Message_sentimentScore_idx" ON "Message"("sentimentScore");

-- Create composite indexes for analytics queries
CREATE INDEX "Message_sentiment_category_idx" ON "Message"("sentiment", "category");
CREATE INDEX "Message_sentAt_sentiment_idx" ON "Message"("sentAt", "sentiment");
CREATE INDEX "Message_isEarlyWarning_sentAt_idx" ON "Message"("isEarlyWarning", "sentAt");