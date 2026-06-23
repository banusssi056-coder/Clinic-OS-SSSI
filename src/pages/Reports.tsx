import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard } from "@/components/ui-bits";
import { FileBarChart2, Download, TrendingUp, Users, IndianRupee, AlertTriangle } from "lucide-react";
import { inrShort, inr } from "@/lib/format";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { toast } from "sonner";

export default function Reports() {
  const { data: invoices = [] } = useQuery({ queryKey:["rep-inv"], queryFn: async ()=> (await supabase.from("invoices").select("*").order("created_at")).data || [] });
  const { data: patients = [] } = useQuery({ queryKey:["rep-pat"], queryFn: async ()=> (await supabase.from("patients").select("*")).data || [] });
  const { data: appts = [] } = useQuery({ queryKey:["rep-app"], queryFn: async ()=> (await supabase.from("appointments").select("*")).data || [] });

  const totalRev = invoices.reduce((s:number,i:any)=>s+Number(i.paid||0),0);
  const noShow = appts.filter((a:any)=>a.status==="NoShow").length;
  const completed = appts.filter((a:any)=>a.status==="Completed").length;
  const retention = patients.length ? Math.round(patients.filter((p:any)=>p.status==="Active").length / patients.length * 100) : 0;

  const monthly: Record<string, number> = {};
  invoices.forEach((i:any)=>{ const d=new Date(i.created_at); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; monthly[k]=(monthly[k]||0)+Number(i.paid||0); });
  const monthData = Object.entries(monthly).map(([month,revenue])=>({month, revenue})).slice(-6);

  const sourceData = Object.entries(patients.reduce((acc:any,p:any)=>{acc[p.source]=(acc[p.source]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));

  const exportCSV = () => {
    const headers = ["Metric","Value"];
    const data = [["Total Revenue (INR)", totalRev], ["Total Patients", patients.length], ["Total Appointments", appts.length], ["No-shows", noShow], ["Completed", completed], ["Retention %", retention]];
    const csv = [headers.join(","), ...data.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="clinicos-summary.csv"; a.click();
    toast.success("Report exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive clinic performance" icon={FileBarChart2} gradient="from-sky-500 to-blue-500"
        actions={<button onClick={exportCSV} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Download className="w-4 h-4"/> Export CSV</button>}/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Revenue" value={inrShort(totalRev)} icon={IndianRupee} gradient="from-emerald-500 to-teal-500"/>
        <KpiCard label="Total Patients" value={patients.length} icon={Users} gradient="from-purple-500 to-pink-500"/>
        <KpiCard label="No-show Rate" value={`${appts.length?Math.round(noShow/appts.length*100):0}%`} icon={AlertTriangle} gradient="from-red-500 to-pink-500"/>
        <KpiCard label="Retention" value={`${retention}%`} icon={TrendingUp} gradient="from-amber-500 to-orange-500"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Monthly Revenue" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="month" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={(v)=>inrShort(v)}/>
              <Tooltip formatter={(v:any)=>inr(v)} contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}}/>
              <Line type="monotone" dataKey="revenue" stroke="hsl(270 91% 55%)" strokeWidth={3} dot={{r:5, fill:"hsl(330 81% 60%)"}}/>
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Acquisition by Source" icon={Users}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}}/>
              <Bar dataKey="value" fill="hsl(24 95% 58%)" radius={[8,8,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  );
}
