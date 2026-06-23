import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Settings, Building2, MessageCircle, Package, Users, Activity, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { relTime, inr } from "@/lib/format";

const TABS = [
  { id:"clinic", label:"Clinic", icon: Building2 },
  { id:"templates", label:"Templates (CMS)", icon: MessageCircle },
  { id:"packages", label:"Packages & Pricing", icon: Package },
  { id:"users", label:"Users & Roles", icon: Users },
  { id:"theme", label:"Theme", icon: Palette },
  { id:"activity", label:"Activity Log", icon: Activity },
];

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("clinic");
  const { data: settings } = useQuery({ queryKey:["settings"], queryFn: async ()=> (await supabase.from("settings").select("*").limit(1).maybeSingle()).data });
  const { data: packages = [] } = useQuery({ queryKey:["pkgs"], queryFn: async ()=> (await supabase.from("packages").select("*")).data || [] });
  const { data: users = [] } = useQuery({ queryKey:["users"], queryFn: async ()=> (await supabase.from("staff").select("*").order("name")).data || [] });
  const { data: logs = [] } = useQuery({ queryKey:["logs"], queryFn: async ()=> (await supabase.from("activity_logs").select("*").order("created_at",{ascending:false}).limit(50)).data || [] });

  const [s, setS] = useState<any>({});
  useEffect(() => { if (settings) setS(settings); }, [settings]);
  const saveSettings = async () => { const { error } = await supabase.from("settings").update(s).eq("id", s.id); if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({queryKey:["settings"]}); } };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Panel" subtitle="CMS · Settings · Roles · Activity log" icon={Settings} gradient="from-slate-500 to-slate-700"/>
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        {TABS.map(t=>{
          const I = t.icon;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition ${tab===t.id?"btn-glossy":"bg-muted hover:bg-muted/70"}`}>
              <I className="w-4 h-4"/>{t.label}
            </button>
          );
        })}
      </div>

      {tab==="clinic" && s.id && (
        <SectionCard title="Clinic Profile" icon={Building2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["clinic_name","Clinic name"],["tagline","Tagline"],["phone","Phone"],["email","Email"],["address","Address"],["working_hours","Working hours"],["timezone","Timezone"],["currency","Currency"],
            ].map(([k,label])=>(
              <div key={k}><label className="text-xs font-semibold mb-1 block">{label}</label>
                <input value={s[k]||""} onChange={(e)=>setS({...s,[k]:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-muted border border-border"/></div>
            ))}
          </div>
          <button onClick={saveSettings} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold mt-4">Save</button>
        </SectionCard>
      )}

      {tab==="templates" && s.id && (
        <SectionCard title="WhatsApp Templates · CMS" icon={MessageCircle}>
          <div className="space-y-4">
            {[["whatsapp_template_followup","Follow-up"],["whatsapp_template_noshow","No-show"],["whatsapp_template_review","Review request"]].map(([k,label])=>(
              <div key={k}><label className="text-xs font-semibold mb-1 block">{label}</label>
                <textarea value={s[k]||""} onChange={(e)=>setS({...s,[k]:e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"/>
                <p className="text-[10px] text-muted-foreground mt-1">Use {`{{name}}`} for personalization</p>
              </div>
            ))}
          </div>
          <button onClick={saveSettings} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold mt-4">Save Templates</button>
        </SectionCard>
      )}

      {tab==="packages" && (
        <SectionCard title="Packages & Pricing" icon={Package}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packages.map((p:any)=>(
              <div key={p.id} className="glass-card rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <div><div className="font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.description}</div></div>
                  <div className="text-right"><div className="text-xl font-bold gradient-text">{inr(p.price)}</div><div className="text-[10px]">{p.sessions_total} sessions · {p.validity_days} days</div></div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">{(p.services||[]).map((s:string)=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab==="users" && (
        <SectionCard title="Users & Roles" icon={Users}>
          <div className="space-y-2">
            {users.map((u:any)=>(
              <div key={u.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center font-bold">{u.name?.[0]}</div>
                <div className="flex-1"><div className="font-semibold text-sm">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></div>
                <span className="text-xs px-2 py-1 rounded-full gradient-soft-bg border border-border font-medium">{u.role}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab==="theme" && (
        <SectionCard title="Theme & Branding" icon={Palette}>
          <p className="text-sm text-muted-foreground mb-4">Choose your accent gradient. Currently: <strong className="gradient-text">Purple → Pink → Orange</strong></p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Purple→Pink→Orange","Blue→Cyan→Teal","Emerald→Lime","Rose→Fuchsia"].map(t=>(
              <button key={t} className="glass-card rounded-xl p-4 hover:scale-105 transition">
                <div className="h-12 rounded-lg mb-2" style={{background:"var(--gradient-primary)"}}/>
                <div className="text-xs font-semibold">{t}</div>
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {tab==="activity" && (
        <SectionCard title="Activity Log" icon={Activity}>
          <div className="space-y-1">
            {logs.map((l:any)=>(
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-sm">
                <div className="w-8 h-8 rounded-full gradient-bg text-white flex items-center justify-center text-xs font-bold">{l.actor?.[0]||"S"}</div>
                <div className="flex-1"><span className="font-semibold">{l.actor}</span> · {l.action} <span className="text-muted-foreground">on {l.entity}</span></div>
                <div className="text-xs text-muted-foreground">{relTime(l.created_at)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
