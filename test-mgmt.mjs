const token = "REMOVED_SECRET";
const ref = "dpltwshofczdktwppxim";
const queries = [
  "ALTER TABLE wellness_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
  "ALTER TABLE health_coaching_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
  "ALTER TABLE diagnosis_suggestions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
];

async function run() {
  for (const query of queries) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });
    console.log(`Query: ${query.substring(0, 30)}... Status:`, res.status);
  }
}
run();
