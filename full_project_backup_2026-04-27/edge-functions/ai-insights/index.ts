// AI Insights edge function — uses Lovable AI Gateway (Gemini)
// CORS for browser calls; serves both insight-card generation and chat
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the AI Growth Strategist for ClinicOS, a clinic operations platform. You ONLY analyze the clinic's CRM data provided in context. Frame every answer around COMMERCIAL VALUE — revenue growth, retention, no-show recovery, ROI of campaigns, staff productivity, and time savings. Be concise, action-oriented, and India-specific (use ₹ INR). Use bullet points and bolded key numbers. Never invent data — only use what's in the provided context. If something isn't in the context, say so and suggest what to track. Keep answers under 220 words unless asked for detail.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, question, context, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    const ctxBlob = context ? `\n\n=== CLINIC CRM SNAPSHOT ===\n${JSON.stringify(context, null, 2)}\n=== END SNAPSHOT ===` : "";

    if (mode === "insights") {
      messages.push({
        role: "user",
        content: `Generate 6 punchy insight cards for the clinic owner. Each card should be a single insight focused on commercial value (revenue, retention, no-show, campaigns, staff). Return STRICT JSON:
{"insights":[{"title":"...","metric":"...","insight":"...","action":"...","tone":"good|warn|opportunity"}]}
Use the data below. Keep "insight" under 18 words, "action" under 14 words.${ctxBlob}`,
      });
    } else {
      // chat
      if (Array.isArray(history)) for (const h of history) messages.push(h);
      messages.push({ role: "user", content: `${question}${ctxBlob}` });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        ...(mode === "insights" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    if (mode === "insights") {
      try {
        const parsed = JSON.parse(text);
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ insights: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    return new Response(JSON.stringify({ answer: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
