// Test Supabase connection with a privileged key.
// RLS is enabled on CRM tables, so anon-key reads are expected to be blocked.
const path = require('node:path');
const { createRequire } = require('node:module');

const requireFromWeb = createRequire(path.join(__dirname, 'apps/web/package.json'));
const { createClient } = requireFromWeb('@supabase/supabase-js');
const dotenv = requireFromWeb('dotenv');

dotenv.config({ path: 'apps/web/.env' });
dotenv.config({ path: 'agents/.env', override: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/web/.env or agents/.env'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.from('agents').select('count');
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testConnection();
