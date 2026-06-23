import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MjrhR84uEVAkkNIijlUxGA_FiYBgFv3";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const { data, error } = await supabase.from("consultation_sessions").select("*").limit(1);
  if (error) console.error("Error:", error);
  else console.log("Columns:", Object.keys(data[0] || {}));
}
check();
