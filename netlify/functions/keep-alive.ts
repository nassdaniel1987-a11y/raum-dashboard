import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const handler = async () => {
  const timestamp = new Date().toISOString();

  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${timestamp}] Missing Supabase environment variables`);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Supabase configuration' }),
      };
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Execute a minimal query to keep database active
    const { data, error } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`[${timestamp}] Keep-alive query failed:`, error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database query failed', details: error.message }),
      };
    }

    console.log(`[${timestamp}] Keep-alive query succeeded. Rows returned: ${data?.length || 0}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Supabase database keep-alive successful',
        timestamp,
        rowsChecked: data?.length || 0,
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] Unexpected error in keep-alive function:`, errorMessage);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: errorMessage }),
    };
  }
};
