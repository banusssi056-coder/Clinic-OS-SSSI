import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Sparkles, Send, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Insight = { title: string; metric: string; insight: string; action: string; tone: "good"|"warn"|"opportunity" };

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<{role:"user"|"assistant";content:string}[]>([
    { role: "assistant", content: "Hi! I'm your AI Growth Strategist. Ask me anything about **revenue growth**, **retention**, **no-shows**, **campaign ROI**, or **how to make more in less time** — grounded only in your CRM data." }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Build a lightweight context snapshot
  const { data: ctx } = useQuery({
    queryKey: ["ai-ctx"],
    queryFn: async () => {
      const [p, a, i, c, m, r] = await Promise.all([
        supabase.from("patients").select("id,name,source,status,lifetime_value,last_visit,city,tags"),
        supabase.from("appointments").select("id,status,type,scheduled_at"),
        supabase.from("invoices").select("id,total,paid,payment_mode,created_at,status"),
        supabase.from("campaigns").select("name,channel,sent_count,booked,revenue_attributed,cost"),
        supabase.from("messages").select("status").limit(50),
        supabase.from("reviews").select("rating,platform"),
      ]);
      const totalRev = (i.data||[]).reduce((s,x:any)=>s+Number(x.paid||0),0);
      const noShows = (a.data||[]).filter((x:any)=>x.status==="NoShow").length;
      return {
        clinic: "Kapoor Family Clinic, Mumbai",
        currency: "INR",
        kpis: {
          totalPatients: (p.data||[]).length,
          atRisk: (p.data||[]).filter((x:any)=>x.status==="At Risk").length,
          totalAppointments: (a.data||[]).length,
          completed: (a.data||[]).filter((x:any)=>x.status==="Completed").length,
          noShows,
          noShowRate: (a.data||[]).length ? +(noShows/(a.data||[]).length*100).toFixed(1) : 0,
          totalRevenue: totalRev,
          pendingInvoices: (i.data||[]).filter((x:any)=>x.status==="Pending").length,
          avgInvoice: (i.data||[]).length ? Math.round(totalRev/(i.data||[]).length) : 0,
          avgRating: (r.data||[]).length ? +((r.data||[]).reduce((s,x:any)=>s+x.rating,0)/(r.data||[]).length).toFixed(2) : 0,
        },
        patientSources: countBy(p.data||[], "source"),
        paymentModes: countBy(i.data||[], "payment_mode"),
        campaigns: c.data,
        atRiskSample: (p.data||[]).filter((x:any)=>x.status==="At Risk").slice(0,5).map((x:any)=>({name:x.name, ltv:x.lifetime_value, lastVisit:x.last_visit})),
      };
    }
  });

  const generateInsights = async () => {
    if (!ctx) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", { body: { mode: "insights", context: ctx } });
      if (error) throw error;
      if ((data as any).error) { toast.error((data as any).error); return; }
      setInsights((data as any).insights || []);
    } catch (e:any) { toast.error("Could not generate insights: " + (e.message||e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (ctx && insights.length === 0) generateInsights(); /* eslint-disable-next-line */ }, [ctx]);

  const ask = async (q: string) => {
    if (!q.trim() || !ctx) return;
    const newHistory = [...chat, { role: "user" as const, content: q }];
    setChat(newHistory); setInput(""); setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { mode: "chat", question: q, context: ctx, history: chat.slice(-6) }
      });
      if (error) throw error;
      if ((data as any).error) { setChat([...newHistory, { role: "assistant", content: "⚠️ " + (data as any).error }]); }
      else setChat([...newHistory, { role: "assistant", content: (data as any).answer || "(no response)" }]);
    } catch (e:any) {
      setChat([...newHistory, { role: "assistant", content: "⚠️ " + (e.message||"Error") }]);
    } finally { setThinking(false); }
  };

  const suggestions = [
    "Where am I losing the most revenue?",
    "Which campaign has the best ROI?",
    "How can I reduce no-shows next month?",
    "Top 3 actions to grow revenue 20%?",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Growth Insights"
        subtitle="Powered by Gemini · Grounded only in your clinic data"
        icon={Sparkles}
        gradient="from-pink-500 via-fuchsia-500 to-purple-500"
        actions={
          <button onClick={generateInsights} disabled={loading} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>} Regenerate
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && insights.length === 0 && Array.from({length:6}).map((_,i)=>(
          <div key={i} className="glass-card rounded-2xl p-5 h-40 shimmer"/>
        ))}
        {insights.map((ins, i) => {
          const tone = ins.tone === "good" ? { c: "from-emerald-500 to-teal-500", I: TrendingUp }
            : ins.tone === "warn" ? { c: "from-red-500 to-pink-500", I: AlertTriangle }
            : { c: "from-amber-500 to-orange-500", I: Lightbulb };
          return (
            <div key={i} className="glow-card rounded-2xl p-5 relative overflow-hidden">
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-gradient-to-br ${tone.c} blur-2xl`}/>
              <div className="flex items-start gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tone.c} text-white flex items-center justify-center shrink-0`}><tone.I className="w-4 h-4"/></div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{ins.title}</div>
                  <div className="text-2xl font-bold gradient-text">{ins.metric}</div>
                </div>
              </div>
              <p className="text-sm text-foreground/90 mb-2">{ins.insight}</p>
              <div className="text-xs text-primary font-semibold">→ {ins.action}</div>
            </div>
          );
        })}
      </div>

      <SectionCard title="Chat with your CRM data" subtitle="Ask anything · Get commercial-value answers" icon={Sparkles}>
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1 mb-3">
          {chat.map((m,i)=>(
            <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role==="user"?"btn-glossy":"bg-muted"}`} style={{whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            </div>
          ))}
          {thinking && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Thinking...</div></div>}
        </div>
        <div className="flex gap-2 flex-wrap mb-2">
          {suggestions.map(s => (
            <button key={s} onClick={()=>ask(s)} className="text-xs px-3 py-1.5 rounded-full gradient-soft-bg border border-border hover:border-primary transition">{s}</button>
          ))}
        </div>
        <form onSubmit={(e)=>{e.preventDefault(); ask(input);}} className="flex gap-2">
          <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask about revenue, retention, no-shows, campaigns..." className="flex-1 px-4 py-2.5 rounded-xl bg-muted/60 border border-border focus:bg-card focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"/>
          <button type="submit" disabled={!input.trim()||thinking} className="btn-glossy px-4 rounded-xl flex items-center gap-1.5 disabled:opacity-50"><Send className="w-4 h-4"/></button>
        </form>
      </SectionCard>
    </div>
  );
}

function countBy(arr: any[], key: string) { return arr.reduce((acc,x)=>{ const k=x[key]||"—"; acc[k]=(acc[k]||0)+1; return acc; }, {}); }
