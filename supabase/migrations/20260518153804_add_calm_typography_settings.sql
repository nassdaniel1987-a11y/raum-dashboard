alter table if exists public.app_settings
	add column if not exists calm_title_font_size integer not null default 42,
	add column if not exists calm_text_font_size integer not null default 24;
