const { createClient } = require('@supabase/supabase-js');
const SUPABASE_KEY = 'sb_publishable_7gJM4lgSUGKMeVdrJ_25cA_r1mUW4l9';
const SUPABASE_URL = 'https://zidwpnxhmypmknmchbnt.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@rru.ac.in',
        password: 'Placement@2025'
    });
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
