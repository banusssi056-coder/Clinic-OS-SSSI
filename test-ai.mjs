import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://dpltwshofczdktwppxim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Set in .env


const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testAI() {
  console.log("Testing ai-insights edge function with Gemini...\n");

  // Test 1: Chat mode
  console.log("=== Test 1: Chat Mode ===");
  const { data: chatData, error: chatError } = await supabase.functions.invoke("ai-insights", {
    body: {
      mode: "chat",
      systemPrompt: "You are a helpful assistant. Keep responses short.",
      question: "Reply with ONLY the text: AI is working correctly!",
      context: {}
    }
  });

  if (chatError) {
    console.error("❌ Chat test FAILED:", chatError.message);
  } else {
    console.log("✅ Chat test PASSED");
    console.log("   Answer:", chatData?.answer);
  }

  // Wait 2 seconds between calls
  await new Promise(r => setTimeout(r, 2000));

  // Test 2: Insights mode
  console.log("\n=== Test 2: Insights Mode ===");
  const { data: insightsData, error: insightsError } = await supabase.functions.invoke("ai-insights", {
    body: {
      mode: "insights",
      context: {
        total_patients: 150,
        appointments_this_month: 45,
        revenue_this_month: 90000,
        no_show_rate: 12
      }
    }
  });

  if (insightsError) {
    console.error("❌ Insights test FAILED:", insightsError.message);
  } else {
    console.log("Raw insightsData:", insightsData);
    const insights = insightsData?.insights || [];
    console.log("✅ Insights test PASSED");
    console.log(`   Generated ${insights.length} insight cards`);
    if (insights.length > 0) {
      console.log("   First insight:", insights[0]?.title, "-", insights[0]?.insight);
    }
  }

  console.log("\n=== All Tests Complete ===");
}

testAI().catch(console.error);
