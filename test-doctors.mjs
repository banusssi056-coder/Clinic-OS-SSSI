import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Set in .env

// To check auth users, we'd need service_role key, but we can just check doctors table
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkDoctors() {
  const { data, error } = await supabase.from("doctors").select("id, name, user_id");
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Doctors:", data);
  }
}
checkDoctors();
