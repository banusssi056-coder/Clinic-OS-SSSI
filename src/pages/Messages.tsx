import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { relTime } from "@/lib/format";

export default function Messages() {
  const qc = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [body, setBody] = useState("");
  const { data: patients = [] } = useQuery({ queryKey:["pats-for-msg"], queryFn: async ()=> (await supabase.from("patients").select("id,name").order("name")).data || [] });
  const { data: messages = [] } = useQuery({ queryKey:["messages"], queryFn: async ()=> (await supabase.from("messages").select("*, patients(name)").order("sent_at",{ascending:false}).limit(200)).data || [] });

  const threads = (messages as any[]).reduce((acc:any,m:any)=>{ const k = m.patient_id; if(!acc[k]) acc[k]={ name: m.patients?.name||"—", id:k, messages:[] }; acc[k].messages.push(m); return acc; }, {});
  const threadList = Object.values(threads);
  const current = selectedPatient ? threads[selectedPatient] : (threadList[0] as any);
  const activeId = current?.id;

  const send = async () => {
    if (!body.trim() || !activeId) return;
    const { error } = await supabase.from("messages").insert({ patient_id: activeId, channel: "WhatsApp", direction: "out", body, status: "Sent" });
    if (error) toast.error(error.message); else { toast.success("Message sent"); setBody(""); qc.invalidateQueries({queryKey:["messages"]}); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Communications" subtitle="WhatsApp-first messaging · click-to-action templates" icon={MessageCircle} gradient="from-green-500 to-emerald-500"/>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        <SectionCard title="Patient Threads" icon={MessageCircle} className="overflow-hidden flex flex-col">
          <div className="space-y-1 overflow-y-auto scrollbar-thin -mx-2 px-2 flex-1">
            {threadList.map((t:any)=>(
              <button key={t.id} onClick={()=>setSelectedPatient(t.id)} className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 ${activeId===t.id?"gradient-soft-bg border border-primary/30":"hover:bg-muted"}`}>
                <div className="w-9 h-9 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-xs">{t.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{t.messages[0]?.body}</div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={current?.name || "Select a thread"} icon={MessageCircle} className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-3">
            {current?.messages?.slice().reverse().map((m:any)=>(
              <div key={m.id} className={`flex ${m.direction==="out"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.direction==="out"?"btn-glossy":"bg-muted"}`}>
                  <div>{m.body}</div>
                  <div className="text-[10px] mt-1 opacity-70 flex items-center gap-1">{relTime(m.sent_at)} · <StatusPill value={m.status}/></div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e)=>{e.preventDefault(); send();}} className="flex gap-2">
            <input value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Type a WhatsApp message..." className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border focus:bg-card focus:border-primary/30 focus:outline-none text-sm"/>
            <button type="submit" className="btn-glossy px-4 rounded-xl"><Send className="w-4 h-4"/></button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
