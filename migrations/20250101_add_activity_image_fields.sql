-- Migration: Add activity image fields to daily_configs table
-- Date: 2025-01-01
-- Description: Adds fields for activity images (URL, size, crop settings) to daily_configs

-- Add activity_image_url column
ALTER TABLE daily_configs
ADD COLUMN IF NOT EXISTS activity_image_url TEXT;

-- Add activity_image_size column with default 'medium'
ALTER TABLE daily_configs
ADD COLUMN IF NOT EXISTS activity_image_size TEXT DEFAULT 'medium'
CHECK (activity_image_size IN ('small', 'medium', 'large'));

-- Add activity_image_crop column as JSONB for crop coordinates
ALTER TABLE daily_configs
ADD COLUMN IF NOT EXISTS activity_image_crop JSONB;

-- Add comment to explain the columns
COMMENT ON COLUMN daily_configs.activity_image_url IS 'URL or base64 data of the activity image (pinned to card, not background)';
COMMENT ON COLUMN daily_configs.activity_image_size IS 'Display size of activity image: small (~25%), medium (~40%), large (~60%)';
COMMENT ON COLUMN daily_configs.activity_image_crop IS 'Crop coordinates as JSON: {x, y, width, height}';

-- Create index on activity_image_url for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_configs_activity_image_url
ON daily_configs(activity_image_url)
WHERE activity_image_url IS NOT NULL;
