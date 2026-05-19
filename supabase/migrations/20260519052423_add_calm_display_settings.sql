alter table if exists public.app_settings
	add column if not exists calm_card_gap_px integer not null default 14,
	add column if not exists calm_card_padding_px integer not null default 18,
	add column if not exists calm_image_width_percent integer not null default 38,
	add column if not exists calm_header_density text not null default 'compact';
