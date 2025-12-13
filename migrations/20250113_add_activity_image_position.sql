-- Migration: Add activity_image_position column for WYSIWYG editor
-- Date: 2025-01-13
-- Description: Adds a new JSONB column to store image position & zoom instead of crop coordinates

-- Add new column for position & zoom (JSONB)
ALTER TABLE daily_configs
ADD COLUMN IF NOT EXISTS activity_image_position JSONB;

COMMENT ON COLUMN daily_configs.activity_image_position IS 'WYSIWYG position & zoom as JSON: {x: %, y: %, zoom: scale}. Replaces activity_image_crop.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_configs_activity_image_position
ON daily_configs(activity_image_position)
WHERE activity_image_position IS NOT NULL;

-- Note: activity_image_crop column is kept for backwards compatibility
-- but will be deprecated in favor of activity_image_position
