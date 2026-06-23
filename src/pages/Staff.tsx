import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { DataGrid, Column } from "@/components/DataGrid";
import { UserCog, Trophy } from "lucide-react";
import { fmtDateTime12 } from "@/lib/format";
import { toast } from "sonner";

export default function Staff() {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey:["staff"], queryFn: async ()=> (await supabase.from("staff").select("*").order("performance_score",{ascending:false})).data || [] });
  const { data: tasks = [] } = useQuery({ queryKey:["tasks"], queryFn: async ()=> (await supabase.from("tasks").select("*, staff(name), patients(name)").order("due_at")).data || [] });

  const updateStaff = async (id:string, patch:any)=>{ const {error}=await supabase.from("staff").update(patch).eq("id",id); if(error)toast.error(error.message); else {toast.success("Saved"); qc.invalidateQueries({queryKey:["staff"]});}};
  const bulkUpdateStaff = async (ids:string[], patch:any)=>{ const {error}=await supabase.from("staff").update(patch).in("id",ids); if(error)toast.error(error.message); else {toast.success(`Updated ${ids.length}`); qc.invalidateQueries({queryKey:["staff"]});}};
  const updateTask = async (id:string, patch:any)=>{ const {error}=await supabase.from("tasks").update(patch).eq("id",id); if(error)toast.error(error.message); else {toast.success("Saved"); qc.invalidateQueries({queryKey:["tasks"]});}};
  const bulkUpdateTask = async (ids:string[], patch:any)=>{ const {error}=await supabase.from("tasks").update(patch).in("id",ids); if(error)toast.error(error.message); else {toast.success(`Updated ${ids.length}`); qc.invalidateQueries({queryKey:["tasks"]});}};

  const staffCols: Column<any>[] = [
    { key:"name", label:"Name", editable:true, width:160, render: r=><span className="font-semibold">{r.name}</span> },
    { key:"role", label:"Role", type:"select", options:["Receptionist","Nurse","Admin","Doctor"], editable:true, width:130 },
    { key:"phone", label:"Phone", editable:true, width:140 },
    { key:"email", label:"Email", editable:true, width:200 },
    { key:"status", label:"Status", type:"select", options:["Active","On Leave","Inactive"], editable:true, width:110, render: r=><StatusPill value={r.status}/> },
    { key:"performance_score", label:"Score", type:"number", editable:true, width:100, render: r=><div className="flex items-center gap-2"><div className="w-16 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-bg" style={{width:`${r.performance_score}%`}}/></div><span className="text-xs font-bold">{r.performance_score}</span></div> },
  ];

  const taskCols: Column<any>[] = [
    { key:"title", label:"Task", editable:true, width:220, render: r=><span className="font-medium">{r.title}</span> },
    { key:"assignee", label:"Assignee", accessor: r=>r.staff?.name, width:140 },
    { key:"related_patient", label:"Patient", accessor: r=>r.patients?.name||"—", width:140 },
    { key:"due_at", label:"Due", type:"date", width:170, render: r=><span>{fmtDateTime12(r.due_at)}</span> },
    { key:"priority", label:"Priority", type:"select", options:["Low","Medium","High"], editable:true, width:100, render: r=><StatusPill value={r.priority}/> },
    { key:"status", label:"Status", type:"select", options:["Open","Done"], editable:true, width:100, render: r=><StatusPill value={r.status}/> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Tasks" subtitle="Performance tracking · Task board · Roles" icon={UserCog} gradient="from-indigo-500 to-purple-500"/>

      <SectionCard title="Performance Leaderboard" icon={Trophy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {staff.slice(0,6).map((s:any,i:number)=>(
            <div key={s.id} className="glass-card rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{["🥇","🥈","🥉","⭐","⭐","⭐"][i]}</div>
              <div className="w-12 h-12 mx-auto rounded-full gradient-bg text-white flex items-center justify-center font-bold mb-2">{s.name?.[0]}</div>
              <div className="text-sm font-semibold truncate">{s.name}</div>
              <div className="text-[10px] text-muted-foreground">{s.role}</div>
              <div className="mt-1 text-lg font-bold gradient-text">{s.performance_score}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Staff Members" icon={UserCog}>
        <DataGrid rows={staff as any[]} columns={staffCols} onUpdate={updateStaff} onBulkUpdate={bulkUpdateStaff} searchPlaceholder="Search staff..."/>
      </SectionCard>

      <SectionCard title="Task Board" icon={UserCog}>
        <DataGrid rows={tasks as any[]} columns={taskCols} onUpdate={updateTask} onBulkUpdate={bulkUpdateTask} searchPlaceholder="Search tasks..."/>
      </SectionCard>
    </div>
  );
}
