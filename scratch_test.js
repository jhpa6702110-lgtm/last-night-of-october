import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

console.log('URL:', url);
console.log('Key:', key);

const supabase = createClient(url, key);

async function run() {
  try {
    const { data, error } = await supabase.from('alumni').select('id, name, last_active_at').limit(15);
    if (error) {
      console.error('Error fetching alumni:', error);
    } else {
      console.log('Alumni list:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
