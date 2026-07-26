import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function run() {
  try {
    const localNow = new Date();
    const localNowISO = localNow.toISOString();
    
    // Check if we can find anyone active in the last 90 seconds, 300 seconds, and 1 hour
    const ninetySecAgo = new Date(Date.now() - 90000).toISOString();
    const tenMinAgo = new Date(Date.now() - 600000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    
    console.log('Current ISO time on script host:', localNowISO);
    console.log('ninetySecAgo:', ninetySecAgo);
    console.log('tenMinAgo:', tenMinAgo);
    
    // Query 90 seconds
    const q1 = await supabase.from('alumni').select('name, last_active_at').gte('last_active_at', ninetySecAgo);
    console.log('Active in last 90s:', q1.data);
    
    // Query 10 minutes
    const q2 = await supabase.from('alumni').select('name, last_active_at').gte('last_active_at', tenMinAgo);
    console.log('Active in last 10m:', q2.data);

    // Query 1 day
    const q3 = await supabase.from('alumni').select('name, last_active_at').gte('last_active_at', oneDayAgo);
    console.log('Active in last 1d (count):', q3.data?.length);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
