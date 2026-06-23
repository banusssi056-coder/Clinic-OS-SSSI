import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard, StatusPill } from "@/components/ui-bits";
import { LayoutDashboard, IndianRupee, Users, CalendarCheck, AlertTriangle, MessageCircle, TrendingUp, Activity } from "lucide-react";
import { inr, inrShort, fmtTime12 } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const PIE_COLORS = ["hsl(270 91% 55%)", "hsl(330 81% 60%)", "hsl(24 95% 58%)", "hsl(199 89% 55%)", "hsl(142 71% 45%)"];

export default function Dashboard() {
  const nav = useNavigate();
  const { data: appts = [] } = useQuery({ queryKey: ["appts-all"], queryFn: async () => (await supabase.from("appointments").select("*, patients(name), doctors(name)").order("scheduled_at")).data || [] });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices-all"], queryFn: async () => (await supabase.from("invoices").select("*").order("created_at", { ascending: false })).data || [] });
  const { data: patients = [] } = useQuery({ queryKey: ["patients-all"], queryFn: async () => (await supabase.from("patients").select("*")).data || [] });
  const { data: campaigns = [] } = useQuery({ queryKey: ["camps"], queryFn: async () => (await supabase.from("campaigns").select("*")).data || [] });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks-open"], queryFn: async () => (await supabase.from("tasks").select("*").eq("status", "Open")).data || [] });

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const todayAppts = appts.filter((a:any) => { const d = new Date(a.scheduled_at); return d >= today && d < tomorrow; });
  const todayRevenue = invoices.filter((i:any) => new Date(i.created_at) >= today).reduce((s:number,i:any)=>s+Number(i.paid||0),0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate()-7);
  const newPatientsWeek = patients.filter((p:any) => new Date(p.created_at) >= weekStart).length;
  const noShowRate = appts.length ? Math.round(appts.filter((a:any)=>a.status==="NoShow").length / appts.length * 100) : 0;
  const atRisk = patients.filter((p:any) => p.status === "At Risk");
  const totalRevenue = invoices.reduce((s:number,i:any)=>s+Number(i.paid||0),0);

  // Charts
  const revTrend: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate()-i);
    const next = new Date(d); next.setDate(d.getDate()+1);
    const rev = invoices.filter((iv:any)=>{ const c = new Date(iv.created_at); return c>=d && c<next; }).reduce((s:number,iv:any)=>s+Number(iv.paid||0),0);
    revTrend.push({ date: d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}), revenue: rev });
  }
  const sourceData = Object.entries(patients.reduce((acc:any,p:any)=>{acc[p.source]=(acc[p.source]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
  const apptStatusData = Object.entries(appts.reduce((acc:any,a:any)=>{acc[a.status]=(acc[a.status]||0)+1;return acc;},{})).map(([name,value])=>({name,value}));
  const docRevenue = appts.filter((a:any)=>a.status==="Completed").reduce((acc:any,a:any)=>{const n=a.doctors?.name||"—";acc[n]=(acc[n]||0)+1;return acc;},{});
  const docRevData = Object.entries(docRevenue).map(([name,visits]:any)=>({name: name.replace("Dr. ",""), visits}));

  return (
    <div className="space-y-6">
      <PageHeader title="Growth Dashboard" subtitle="Real-time pulse of your clinic · Click any tile to drill in" icon={LayoutDashboard} gradient="from-purple-500 via-pink-500 to-orange-500" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Today's Appts" value={todayAppts.length} sub={`${todayAppts.filter((a:any)=>a.status==="Completed").length} done`} icon={CalendarCheck} gradient="from-blue-500 to-cyan-500" onClick={()=>nav("/appointments")} />
        <KpiCard label="Today Revenue" value={inrShort(todayRevenue)} sub="paid invoices" icon={IndianRupee} gradient="from-amber-500 to-orange-500" onClick={()=>nav("/billing")} trend={{value:12,positive:true}} />
        <KpiCard label="New Patients · 7d" value={newPatientsWeek} sub="this week" icon={Users} gradient="from-emerald-500 to-teal-500" onClick={()=>nav("/patients")} trend={{value:8,positive:true}} />
        <KpiCard label="No-show Rate" value={noShowRate+"%"} sub={`${appts.filter((a:any)=>a.status==="NoShow").length} no-shows`} icon={AlertTriangle} gradient="from-red-500 to-pink-500" onClick={()=>nav("/appointments")} trend={{value:3,positive:false}} />
        <KpiCard label="At-Risk Patients" value={atRisk.length} sub="need win-back" icon={Activity} gradient="from-fuchsia-500 to-purple-500" onClick={()=>nav("/patients?q=At Risk")} />
        <KpiCard label="Lifetime Revenue" value={inrShort(totalRevenue)} sub={`${invoices.length} invoices`} icon={TrendingUp} gradient="from-violet-500 to-indigo-500" onClick={()=>nav("/reports")} trend={{value:24,positive:true}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Revenue · Last 30 Days" icon={TrendingUp} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revTrend}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(270 91% 55%)" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="hsl(330 81% 60%)" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
              <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" tickFormatter={(v)=>inrShort(v)}/>
              <Tooltip contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}} formatter={(v:any)=>inr(v)} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(270 91% 55%)" strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Patient Sources" icon={Users}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={(e:any)=>e.name}>
                {sourceData.map((_,i)=> <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Appointments by Status" icon={CalendarCheck}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={apptStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
              <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
              <Tooltip contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}}/>
              <Bar dataKey="value" fill="hsl(270 91% 55%)" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Top Doctors · Visits" icon={Activity}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={docRevData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))" width={80}/>
              <Tooltip contentStyle={{borderRadius:12, border:"1px solid hsl(var(--border))", background:"hsl(var(--card))"}}/>
              <Bar dataKey="visits" fill="hsl(330 81% 60%)" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Today's Live Queue" icon={Activity}>
          <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
            {todayAppts.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">No appointments today</div>}
            {todayAppts.map((a:any)=>(
              <button key={a.id} onClick={()=>nav("/appointments")} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition text-left">
                <div className="w-8 h-8 rounded-lg gradient-bg text-white flex items-center justify-center text-xs font-bold">{a.token_no || "—"}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{a.patients?.name}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtTime12(a.scheduled_at)} · {a.doctors?.name}</div>
                </div>
                <StatusPill value={a.status} />
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Patients At Risk · 90+ days" icon={AlertTriangle} action={<button onClick={()=>nav("/campaigns")} className="text-xs text-primary font-semibold hover:underline">Launch win-back →</button>}>
          <div className="space-y-2">
            {atRisk.slice(0,6).map((p:any)=>(
              <button key={p.id} onClick={()=>nav("/patients?q="+encodeURIComponent(p.name))} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition text-left">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-bg text-white text-xs flex items-center justify-center font-bold">{p.name[0]}</div>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.city} · LTV {inr(p.lifetime_value)}</div>
                  </div>
                </div>
                <StatusPill value="At Risk" />
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Open Tasks" icon={MessageCircle} action={<button onClick={()=>nav("/staff")} className="text-xs text-primary font-semibold hover:underline">View all →</button>}>
          <div className="space-y-2">
            {tasks.slice(0,6).map((t:any)=>(
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-[10px] text-muted-foreground">Due {new Date(t.due_at).toLocaleDateString("en-IN")}</div>
                </div>
                <StatusPill value={t.priority} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
