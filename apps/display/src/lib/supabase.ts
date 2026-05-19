import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const supabaseUrl = env.PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key';

export const supabase = createClient(
	supabaseUrl,
	supabaseAnonKey,
	{
		realtime: {
			params: {
				eventsPerSecond: 10
			}
		}
	}
);
