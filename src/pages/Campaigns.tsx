import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard, StatusPill } from "@/components/ui-bits";
import { DataGrid, Column } from "@/components/DataGrid";
import { Megaphone, TrendingUp, Users, IndianRupee } from "lucide-react";
import { inr, inrShort } from "@/lib/format";
import { toast } from "sonner";

export default function Campaigns() {
  const qc = useQueryClient();
  const { data: campaigns = [] } = useQuery({ queryKey:["campaigns"], queryFn: async ()=> (await supabase.from("campaigns").select("*").order("created_at",{ascending:false})).data || [] });
  const { data: leads = [] } = useQuery({ queryKey:["leads"], queryFn: async ()=> (await supabase.from("leads").select("*").order("created_at",{ascending:false})).data || [] });

  const totalRev = campaigns.reduce((s:number,c:any)=>s+Number(c.revenue_attributed||0),0);
  const totalSent = campaigns.reduce((s:number,c:any)=>s+Number(c.sent_count||0),0);
  const totalBooked = campaigns.reduce((s:number,c:any)=>s+Number(c.booked||0),0);
  const totalCost = campaigns.reduce((s:number,c:any)=>s+Number(c.cost||0),0);
  const roi = totalCost ? Math.round((totalRev-totalCost)/totalCost*100) : 0;

  const updateLead = async (id:string, patch:any)=>{ const {error}=await supabase.from("leads").update(patch).eq("id",id); if(error)toast.error(error.message); else {toast.success("Saved"); qc.invalidateQueries({queryKey:["leads"]});}};
  const bulkUpdateLead = async (ids:string[], patch:any)=>{ const {error}=await supabase.from("leads").update(patch).in("id",ids); if(error)toast.error(error.message); else {toast.success(`Updated ${ids.length}`); qc.invalidateQueries({queryKey:["leads"]});}};

  const leadCols: Column<any>[] = [
    { key:"name", label:"Name", editable:true, width:140, render: r=><span className="font-semibold">{r.name}</span> },
    { key:"phone", label:"Phone", editable:true, width:140 },
    { key:"source", label:"Source", type:"select", options:["Google","Instagram","WhatsApp","Referral","Facebook"], editable:true, width:120 },
    { key:"status", label:"Status", type:"select", options:["New","Contacted","Booked","Lost"], editable:true, width:110, render: r=><StatusPill value={r.status}/> },
    { key:"estimated_value", label:"Est. Value", type:"currency", editable:true, width:120, render: r=><span className="gradient-text font-semibold">{inr(r.estimated_value)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns & Leads" subtitle="WhatsApp + SMS · ROI tracked · Lead pipeline" icon={Megaphone} gradient="from-fuchsia-500 to-pink-500"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Campaign Revenue" value={inrShort(totalRev)} sub={`${campaigns.length} campaigns`} icon={IndianRupee} gradient="from-emerald-500 to-teal-500"/>
        <KpiCard label="Messages Sent" value={totalSent.toLocaleString()} sub="all-time" icon={Megaphone} gradient="from-fuchsia-500 to-pink-500"/>
        <KpiCard label="Bookings" value={totalBooked} sub="from campaigns" icon={Users} gradient="from-purple-500 to-violet-500"/>
        <KpiCard label="Overall ROI" value={roi+"%"} sub={`spent ${inrShort(totalCost)}`} icon={TrendingUp} gradient="from-amber-500 to-orange-500" trend={{value:roi, positive: roi>0}}/>
      </div>

      <SectionCard title="Active Campaigns" icon={Megaphone}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((c:any)=>{
            const cRoi = c.cost ? Math.round((c.revenue_attributed-c.cost)/c.cost*100) : 0;
            return (
              <div key={c.id} className="glow-card rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 bg-gradient-to-br from-fuchsia-500 to-pink-500 blur-2xl"/>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-sm">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.channel} · {c.audience_filter}</div>
                  </div>
                  <StatusPill value={c.status}/>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">"{c.template}"</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-[10px] text-muted-foreground">Sent</div><div className="font-bold">{c.sent_count}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Booked</div><div className="font-bold gradient-text">{c.booked}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">ROI</div><div className={`font-bold ${cRoi>0?"text-success":"text-destructive"}`}>{cRoi}%</div></div>
                </div>
                <div className="text-xs text-center mt-2 pt-2 border-t border-border">Revenue: <span className="font-semibold">{inr(c.revenue_attributed)}</span></div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <DataGrid rows={leads as any[]} columns={leadCols} onUpdate={updateLead} onBulkUpdate={bulkUpdateLead} searchPlaceholder="Search leads..."/>
    </div>
  );
}
