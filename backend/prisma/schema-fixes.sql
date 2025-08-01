-- Schema fixes for TypeScript compilation errors
-- This file contains SQL commands to add missing fields

-- Add missing sentiment field to Message model
-- ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'NEUTRAL';

-- Add missing fields to existing models based on service expectations
-- Note: These would be applied via Prisma migrations in production

-- For now, we'll handle these via service-level fixes rather than schema changes
to maintain backward compatibility.