import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Set in .env


const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from("appointments").select("status");
  if (error) {
    console.error("Error:", error);
    return;
  }
  const statuses = new Set(data.map(d => d.status));
  console.log("Statuses in DB:", Array.from(statuses));
  console.log("Total appointments:", data.length);
}
test();
