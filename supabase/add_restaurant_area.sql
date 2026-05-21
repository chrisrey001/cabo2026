-- Add area column to restaurants table for regional filtering
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS area TEXT;
