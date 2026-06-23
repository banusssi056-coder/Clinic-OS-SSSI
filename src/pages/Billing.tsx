import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard, StatusPill } from "@/components/ui-bits";
import { DataGrid, Column } from "@/components/DataGrid";
import { IndianRupee, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { inr, inrShort, fmtDate } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

const PIE = ["hsl(270 91% 55%)","hsl(330 81% 60%)","hsl(24 95% 58%)","hsl(199 89% 55%)"];

export default function Billing() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey:["invoices"], queryFn: async () => (await supabase.from("invoices").select("*, patients(name)").order("created_at",{ascending:false})).data || [] });

  const total = rows.reduce((s:number,i:any)=>s+Number(i.paid||0),0);
  const pending = rows.filter((i:any)=>i.status==="Pending").reduce((s:number,i:any)=>s+Number(i.total-i.paid||0),0);
  const avg = rows.length ? Math.round(total/rows.length) : 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const monthRev = rows.filter((i:any)=>new Date(i.created_at) >= new Date(today.getFullYear(), today.getMonth(), 1)).reduce((s:number,i:any)=>s+Number(i.paid||0),0);

  const modeData = Object.entries(rows.reduce((acc:any,i:any)=>{acc[i.payment_mode]=(acc[i.payment_mode]||0)+Number(i.paid);return acc;},{})).map(([name,value])=>({name,value}));
  const dailyData: any[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const next = new Date(d); next.setDate(d.getDate()+1);
    dailyData.push({ date: d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}), revenue: rows.filter((iv:any)=>{const c=new Date(iv.created_at); return c>=d && c<next;}).reduce((s:number,iv:any)=>s+Number(iv.paid||0),0) });
  }

  const update = async (id:string, patch:any)=>{ const {error}=await supabase.from("invoices").update(patch).eq("id",id); if(error)toast.error(error.message); else {toast.success("Saved"); qc.invalidateQueries({queryKey:["invoices"]});}};
  const bulkUpdate = async (ids:string[], patch:any)=>{ const {error}=await supabase.from("invoices").update(patch).in("id",ids); if(error)toast.error(error.message); else {toast.success(`Updated ${ids.length}`); qc.invalidateQueries({queryKey:["invoices"]});}};
  const bulkDelete = async (ids:string[])=>{ const {error}=await supabase.from("invoices").delete().in("id",ids); if(error)toast.error(error.message); else {toast.success("Deleted"); qc.invalidateQueries({queryKey:["invoices"]});}};

  const columns: Column<any>[] = [
    { key:"invoice_no", label:"Invoice", width:110, render: r=><span className="font-mono text-xs font-semibold">{r.invoice_no}</span> },
    { key:"patient", label:"Patient", accessor: r=>r.patients?.name, width:160, render: r=><span className="font-medium">{r.patients?.name}</span> },
    { key:"created_at", label:"Date", type:"date", width:110, render: r=><span>{fmtDate(r.created_at)}</span> },
    { key:"total", label:"Total", type:"currency", editable:true, width:110, render: r=><span className="font-semibold">{inr(r.total)}</span> },
    { key:"paid", label:"Paid", type:"currency", editable:true, width:110, render: r=><span className="text-success font-semibold">{inr(r.paid)}</span> },
    { key:"discount", label:"Discount", type:"currency", editable:true, width:100 },
    { key:"payment_mode", label:"Mode", type:"select", options:["UPI","Cash","Card","Netbanking"], editable:true, width:100 },
    { key:"status", label:"Status", type:"select", options:["Paid","Pending","Refunded"], editable:true, width:110, render: r=><StatusPill value={r.status}/> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Revenue" subtitle="INR · Track every rupee · Click Edit Mode to bulk-update" icon={IndianRupee} gradient="from-amber-500 to-orange-500"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Lifetime Revenue" value={inrShort(total)} sub={`${rows.length} invoices`} icon={TrendingUp} gradient="from-emerald-500 to-teal-500" trend={{value:24,positive:true}}/>
        <KpiCard label="MTD Revenue" value={inrShort(monthRev)} sub="this month" icon={IndianRupee} gradient="from-amber-500 to-orange-500" trend={{value:18,positive:true}}/>
        <KpiCard label="Avg Invoice" value={inr(avg)} sub="ARPU per visit" icon={Wallet} gradient="from-purple-500 to-pink-500"/>
        <KpiCard label="Outstanding" value={inrShort(pending)} sub={`${rows.filter((i:any)=>i.status==="Pending").length} pending`} icon={AlertCircle} gradient="from-red-500 to-pink-500"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Revenue · Last 14 Days" icon={TrendingUp} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
              <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" tickFormatter={(v)=>inrShort(v)}/>
              <Tooltip formatter={(v:any)=>inr(v)} contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}}/>
              <Bar dataKey="revenue" fill="hsl(24 95% 58%)" radius={[8,8,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Payment Modes" icon={Wallet}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={(e:any)=>e.name}>
                {modeData.map((_,i)=><Cell key={i} fill={PIE[i%PIE.length]}/>)}
              </Pie>
              <Tooltip formatter={(v:any)=>inr(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <DataGrid rows={rows as any[]} columns={columns} onUpdate={update} onBulkUpdate={bulkUpdate} onBulkDelete={bulkDelete} searchPlaceholder="Search invoices..."/>
    </div>
  );
}
