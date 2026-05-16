-- Separate WYSIWYG crop for the calm dashboard variant.
ALTER TABLE daily_configs
ADD COLUMN IF NOT EXISTS activity_image_position_calm JSONB;

COMMENT ON COLUMN daily_configs.activity_image_position_calm
IS 'Calm-view WYSIWYG position & zoom as JSON: {x: %, y: %, zoom: scale, rotation: deg}.';

CREATE INDEX IF NOT EXISTS idx_daily_configs_activity_image_position_calm
ON daily_configs(activity_image_position_calm)
WHERE activity_image_position_calm IS NOT NULL;
