import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, KpiCard, SectionCard } from "@/components/ui-bits";
import { Star } from "lucide-react";
import { relTime } from "@/lib/format";

export default function Reviews() {
  const { data: reviews = [] } = useQuery({ queryKey:["reviews"], queryFn: async ()=> (await supabase.from("reviews").select("*, patients(name)").order("posted_at",{ascending:false})).data || [] });
  const avg = reviews.length ? (reviews.reduce((s:number,r:any)=>s+r.rating,0)/reviews.length).toFixed(2) : "0";
  const fives = reviews.filter((r:any)=>r.rating===5).length;
  const google = reviews.filter((r:any)=>r.platform==="Google").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews & Referrals" subtitle="Google + Practo reputation · automated review requests" icon={Star} gradient="from-yellow-500 to-amber-500"/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Average Rating" value={`${avg} ★`} sub={`${reviews.length} reviews`} icon={Star} gradient="from-yellow-500 to-amber-500"/>
        <KpiCard label="5-star Reviews" value={fives} sub={`${Math.round(fives/Math.max(reviews.length,1)*100)}% of total`} icon={Star} gradient="from-emerald-500 to-teal-500"/>
        <KpiCard label="Google Reviews" value={google} sub="primary platform" icon={Star} gradient="from-blue-500 to-cyan-500"/>
        <KpiCard label="Review Rate" value="68%" sub="of paid invoices" icon={Star} gradient="from-purple-500 to-pink-500"/>
      </div>

      <SectionCard title="Recent Reviews" icon={Star}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reviews.map((r:any)=>(
            <div key={r.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-xs">{r.patients?.name?.[0]}</div>
                  <div>
                    <div className="font-semibold text-sm">{r.patients?.name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.platform} · {relTime(r.posted_at)}</div>
                  </div>
                </div>
                <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} className={`w-4 h-4 ${i<r.rating?"fill-yellow-400 text-yellow-400":"text-muted-foreground/30"}`}/>)}</div>
              </div>
              <p className="text-sm text-foreground/90">"{r.text}"</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
