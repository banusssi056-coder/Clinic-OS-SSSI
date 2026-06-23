import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusPill } from "@/components/ui-bits";
import { DataGrid, Column } from "@/components/DataGrid";
import { Users, MessageCircle, Tag, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { inr, fmtDate } from "@/lib/format";

export default function Patients() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [showNew, setShowNew] = useState(false);
  const [n, setN] = useState({ name:"", phone:"", email:"", city:"Mumbai", source:"Walk-in", gender:"Female" });

  const { data: rows = [] } = useQuery({ queryKey: ["patients"], queryFn: async () => (await supabase.from("patients").select("*").order("created_at",{ascending:false})).data || [] });

  const update = async (id: string, patch: any) => { const { error } = await supabase.from("patients").update(patch).eq("id", id); if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({queryKey:["patients"]}); } };
  const bulkUpdate = async (ids: string[], patch: any) => { const { error } = await supabase.from("patients").update(patch).in("id", ids); if (error) toast.error(error.message); else { toast.success(`Updated ${ids.length}`); qc.invalidateQueries({queryKey:["patients"]}); } };
  const bulkDelete = async (ids: string[]) => { const { error } = await supabase.from("patients").delete().in("id", ids); if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({queryKey:["patients"]}); } };
  const bulkMessage = async (ids: string[]) => {
    const inserts = ids.map(id => ({ patient_id: id, channel: "WhatsApp", direction: "out", body: "Hi! A quick reminder from Kapoor Family Clinic.", status: "Sent", template_name: "bulk" }));
    await supabase.from("messages").insert(inserts);
    toast.success(`WhatsApp queued to ${ids.length} patients`);
  };

  const create = async () => {
    if (!n.name || !n.phone) { toast.error("Name & phone required"); return; }
    const { error } = await supabase.from("patients").insert({ ...n });
    if (error) toast.error(error.message); else { toast.success("Patient added"); setShowNew(false); setN({ name:"", phone:"", email:"", city:"Mumbai", source:"Walk-in", gender:"Female" }); qc.invalidateQueries({queryKey:["patients"]}); }
  };

  const columns: Column<any>[] = [
    { key:"name", label:"Name", editable:true, width:170, render: r=> <span className="font-semibold">{r.name}</span> },
    { key:"phone", label:"Phone", editable:true, width:140 },
    { key:"city", label:"City", editable:true, type:"select", options:["Mumbai","Bengaluru","Delhi","Pune","Hyderabad","Chennai"], width:110 },
    { key:"gender", label:"Gender", editable:true, type:"select", options:["Male","Female","Other"], width:90 },
    { key:"source", label:"Source", editable:true, type:"select", options:["Walk-in","Google","Referral","WhatsApp","Instagram","Facebook"], width:110 },
    { key:"status", label:"Status", editable:true, type:"select", options:["Active","At Risk","Inactive"], width:100, render: r=><StatusPill value={r.status}/> },
    { key:"lifetime_value", label:"LTV", editable:true, type:"currency", width:110, render: r=><span className="font-semibold gradient-text">{inr(r.lifetime_value)}</span> },
    { key:"last_visit", label:"Last Visit", type:"date", width:120, render: r=><span>{fmtDate(r.last_visit)}</span> },
    { key:"tags", label:"Tags", type:"tags", width:140, render: r=> <div className="flex gap-1 flex-wrap">{(r.tags||[]).map((t:string)=><span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full gradient-soft-bg border border-border">{t}</span>)}</div> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Patients · CRM" subtitle="Click Edit Mode to update inline · Select rows for bulk actions" icon={Users} gradient="from-emerald-500 to-teal-500"
        actions={<button onClick={()=>setShowNew(true)} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4"/> Add Patient</button>}/>
      <DataGrid rows={rows as any[]} columns={columns} onUpdate={update} onBulkUpdate={bulkUpdate} onBulkDelete={bulkDelete}
        bulkExtraActions={[{ label:"WhatsApp", icon: MessageCircle, onClick: bulkMessage }]}
        searchPlaceholder="Search by name, phone, city, tag..." initialQuery={params.get("q") || ""} />

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setShowNew(false)}>
          <div onClick={(e)=>e.stopPropagation()} className="glow-card rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-bold mb-4 gradient-text">Add Patient</h3>
            <div className="space-y-3">
              <input value={n.name} onChange={(e)=>setN({...n,name:e.target.value})} placeholder="Full name" className="w-full px-3 py-2 rounded-lg bg-muted border border-border"/>
              <input value={n.phone} onChange={(e)=>setN({...n,phone:e.target.value})} placeholder="+91 98xxx xxxxx" className="w-full px-3 py-2 rounded-lg bg-muted border border-border"/>
              <input value={n.email} onChange={(e)=>setN({...n,email:e.target.value})} placeholder="Email (optional)" className="w-full px-3 py-2 rounded-lg bg-muted border border-border"/>
              <div className="grid grid-cols-3 gap-2">
                <select value={n.gender} onChange={(e)=>setN({...n,gender:e.target.value})} className="px-3 py-2 rounded-lg bg-muted border border-border"><option>Female</option><option>Male</option><option>Other</option></select>
                <select value={n.city} onChange={(e)=>setN({...n,city:e.target.value})} className="px-3 py-2 rounded-lg bg-muted border border-border"><option>Mumbai</option><option>Bengaluru</option><option>Delhi</option><option>Pune</option></select>
                <select value={n.source} onChange={(e)=>setN({...n,source:e.target.value})} className="px-3 py-2 rounded-lg bg-muted border border-border"><option>Walk-in</option><option>Google</option><option>Referral</option><option>WhatsApp</option><option>Instagram</option></select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={()=>setShowNew(false)} className="px-4 py-2 rounded-lg bg-muted text-sm">Cancel</button>
              <button onClick={create} className="btn-glossy px-4 py-2 rounded-lg text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
