const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // Set: $env:SUPABASE_ANON_KEY="eyJ..."


async function testDirect() {
  console.log("Direct HTTP test to ai-insights for insights mode...\n");

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      mode: "insights",
      context: {
        total_patients: 150,
        appointments_this_month: 45,
        revenue_this_month: 90000,
        no_show_rate: 12
      }
    })
  });

  console.log("Status:", resp.status, resp.statusText);
  const text = await resp.text();
  console.log("Response:", text);
}

testDirect().catch(console.error);
