// AI Insights edge function — uses Google Gemini API directly
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
    const { mode, question, context, history, systemPrompt, file } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const activeSystemPrompt = systemPrompt || SYSTEM_PROMPT;
    const ctxBlob = context ? `\n\n=== ADDITIONAL CONTEXT ===\n${JSON.stringify(context, null, 2)}\n=== END CONTEXT ===` : "";

    // Build the contents array for Gemini API
    let contents: any[] = [];

    if (mode === "insights") {
      contents.push({
        role: "user",
        parts: [{
          text: `${activeSystemPrompt}\n\nGenerate 6 punchy insight cards for the clinic owner. Each card should be a single insight focused on commercial value (revenue, retention, no-show, campaigns, staff). Return STRICT JSON:\n{"insights":[{"title":"...","metric":"...","insight":"...","action":"...","tone":"good|warn|opportunity"}]}\nUse the data below. Keep "insight" under 18 words, "action" under 14 words.${ctxBlob}`
        }]
      });
    } else {
      // chat mode
      // First message includes the system prompt
      const historyMessages: any[] = [];
      
      if (Array.isArray(history)) {
        for (const h of history) {
          historyMessages.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          });
        }
      }

      const userParts: any[] = [{ text: `${question}${ctxBlob}` }];
      if (file && file.mimeType && file.b64Data) {
        userParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.b64Data
          }
        });
      }

      const ackText = activeSystemPrompt.includes("health assistant") || activeSystemPrompt.includes("lab report")
        ? "Understood. I'm ready to analyze the lab report and explain it in simple, patient-friendly language."
        : "Understood. I'm ready to analyze your clinic data and provide commercial insights.";

      contents = [
        {
          role: "user",
          parts: [{ text: activeSystemPrompt + "\n\nAcknowledge you understand your role." }]
        },
        {
          role: "model",
          parts: [{ text: ackText }]
        },
        ...historyMessages,
        {
          role: "user",
          parts: userParts
        }
      ];
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const resp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          ...(mode === "insights" ? { responseMimeType: "application/json" } : {})
        }
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Gemini API error", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a minute." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error: " + resp.status }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (mode === "insights") {
      try {
        // Strip markdown code fences if present
        const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const parsed = JSON.parse(clean);
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        console.error("Failed to parse JSON from Gemini response:", text, err);
        return new Response(JSON.stringify({
          insights: [],
          error: "Failed to parse JSON from Gemini response",
          rawText: text,
          parseError: err instanceof Error ? err.message : String(err)
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    return new Response(JSON.stringify({ answer: text, response: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
