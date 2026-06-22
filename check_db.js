import { getSupabaseClient } from './src/db/supabaseClient.js';

const check = async () => {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client.');
    process.exit(1);
  }

  const tables = [
    'settings', 'nozzles', 'employees', 'shifts', 'calendar', 'audit_logs',
    'parties', 'cash_party_entries', 'attendance_settings', 'attendance', 'advances', 'salary_payments', 'bill_counter', 'auth', 'daily_records'
  ];
  console.log('====================================================');
  console.log('VERIFYING SUPABASE DATABASE SCHEMA VERSION 2...');
  console.log('====================================================\n');

  let failed = false;
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && error.code === '42P01') {
      console.error(`✗ Table "${table}" DOES NOT exist (relation not found)`);
      failed = true;
    } else if (error) {
      console.log(`✓ Table "${table}" exists (authenticated/RLS active, error code: ${error.code}, message: ${error.message})`);
    } else {
      console.log(`✓ Table "${table}" exists and is accessible`);
    }
  }

  console.log('\n====================================================');
  if (failed) {
    console.log('DATABASE SCHEMA VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('ALL TABLES VERIFIED ON SUPABASE CLOUD');
    process.exit(0);
  }
};

check();
