const SUPABASE_URL = "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbHR3c2hvZmN6ZGt0d3BweGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODA5MjcsImV4cCI6MjA5NDc1NjkyN30.TzqXbmO5LePoQw7I3hhxKWVwDhKEpOCiMB8vRAk_UTc";

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
