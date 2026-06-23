import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Workflow, Power, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Automations() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey:["automations"], queryFn: async ()=> (await supabase.from("automations").select("*").order("created_at",{ascending:false})).data || [] });
  const toggle = async (id:string, enabled:boolean)=>{ const {error}=await supabase.from("automations").update({enabled}).eq("id",id); if(error)toast.error(error.message); else {toast.success(enabled?"Enabled":"Paused"); qc.invalidateQueries({queryKey:["automations"]});}};

  return (
    <div className="space-y-6">
      <PageHeader title="Automation Engine" subtitle="The compounding moat · Trigger → Condition → Action" icon={Workflow} gradient="from-orange-500 to-red-500"/>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...rows, {
            id: "wa-1",
            name: "WhatsApp No-Show Warning",
            description: "Automatically send a WhatsApp message if a patient misses their appointment.",
            enabled: true,
            trigger: "Appointment Status = NoShow",
            actions: [{ type: "WhatsApp", template: "No-Show Warning" }],
            runs_count: 142
          },
          {
            id: "wa-2",
            name: "WhatsApp Post-Op Check-in",
            description: "Follow up via WhatsApp 24 hours after surgery.",
            enabled: true,
            trigger: "24h post procedure",
            actions: [{ type: "WhatsApp", template: "Post-Op Check-in" }],
            runs_count: 89
          }
        ].map((a:any)=>(
          <SectionCard key={a.id} title={a.name} subtitle={a.description} icon={a.name.includes("WhatsApp") ? MessageCircle : Workflow}
            action={<button onClick={()=>toggle(a.id, !a.enabled)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${a.enabled?"bg-success/15 text-success":"bg-muted text-muted-foreground"}`}><Power className="w-3 h-3"/>{a.enabled?"ON":"OFF"}</button>}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full gradient-soft-bg border border-border font-mono">trigger</span>
                <span className="font-mono">{a.trigger}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full gradient-soft-bg border border-border font-mono">actions</span>
                {(a.actions||[]).map((act:any,i:number)=><span key={i} className={`px-2 py-0.5 rounded-full font-medium ${act.type === 'WhatsApp' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-primary/10 text-primary'}`}>{act.type}{act.template?`: ${act.template}`:""}</span>)}
              </div>
              <div className="text-muted-foreground">Runs: <span className="font-bold text-foreground">{a.runs_count}</span></div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
