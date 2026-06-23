import { useState } from "react";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { HeartPulse, Activity, Pill, UserCheck, MessageSquare, Send, CalendarClock, TrendingUp, CheckCircle2, Clock, Watch, Smartphone, RefreshCw } from "lucide-react";

export default function PatientWellness() {
  const [patient, setPatient] = useState("Sarah Smith (28, F)");
  
  // Chat state for Health Coach
  const [chat, setChat] = useState([
    { role: "assistant", text: "Hi Sarah! I noticed you missed your morning dose of Levothyroxine. Have you taken it yet today?" },
    { role: "user", text: "Oh, I forgot! Thanks for reminding me. Just took it now." },
    { role: "assistant", text: "Great! Remember to wait 30-60 minutes before having breakfast for best absorption. How are your energy levels this week?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setChat([...chat, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setChat(prev => [...prev, { role: "assistant", text: "I've noted that in your wellness journal. Keep up the good work!" }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Wellness & Tracking"
        subtitle="Monitor adherence, vitals, and AI health coaching"
        icon={HeartPulse}
        gradient="from-rose-400 to-red-500"
        actions={
          <div className="flex gap-2">
            <select className="px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20" value={patient} onChange={(e)=>setPatient(e.target.value)}>
              <option>Sarah Smith (28, F)</option>
              <option>John Doe (34, M)</option>
              <option>Raj Patel (45, M)</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Vitals & Adherence */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Wellness Tracking */}
          <SectionCard title="Wellness Tracking" subtitle="Recent vitals and lifestyle metrics" icon={Activity}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1 items-center justify-center text-center">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight</div>
                <div className="text-2xl font-bold gradient-text">64.2 <span className="text-sm font-normal text-muted-foreground">kg</span></div>
                <div className="text-[10px] text-success font-medium">↓ 1.5kg this month</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1 items-center justify-center text-center">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg Sleep</div>
                <div className="text-2xl font-bold gradient-text">7.2 <span className="text-sm font-normal text-muted-foreground">hrs</span></div>
                <div className="text-[10px] text-muted-foreground font-medium">Optimal range</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1 items-center justify-center text-center">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">BP</div>
                <div className="text-2xl font-bold gradient-text">118/75</div>
                <div className="text-[10px] text-muted-foreground font-medium">Last checked 2d ago</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1 items-center justify-center text-center">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stress Score</div>
                <div className="text-2xl font-bold gradient-text text-orange-500">4<span className="text-sm font-normal text-muted-foreground">/10</span></div>
                <div className="text-[10px] text-orange-500 font-medium">Slightly elevated</div>
              </div>
            </div>
          </SectionCard>

          {/* Wearable Integration */}
          <SectionCard title="Wearable Devices" subtitle="Live stream from patient's connected devices" icon={Watch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3 relative overflow-hidden">
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center"><Watch className="w-4 h-4"/></div>
                    <span className="font-semibold text-sm">Apple Watch S8</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-success/10 text-success rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Connected
                  </span>
                </div>
                <div className="flex gap-4 z-10 text-sm mt-2">
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">Live HR</span>
                    <span className="font-bold text-lg">72 <span className="text-xs text-muted-foreground">bpm</span></span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block mb-1">O2 Sat</span>
                    <span className="font-bold text-lg">98%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition cursor-pointer text-center min-h-[120px]">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Connect Device</span>
                <span className="text-xs text-muted-foreground">Sync Fitbit, Garmin, or Withings</span>
              </div>
            </div>
          </SectionCard>

          {/* Medication Adherence */}
          <SectionCard title="Medication Adherence" subtitle="Real-time tracking of prescribed Rx" icon={Pill}>
            <div className="space-y-4">
              {/* Med 1 */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm">Levothyroxine 50mcg</h4>
                    <StatusPill value="Active" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">1 tablet every morning (empty stomach)</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Adherence (30 Days)</span>
                      <span className="text-success">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: "92%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Med 2 */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm">Vitamin D3 60k IU</h4>
                    <StatusPill value="At Risk" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">1 capsule once a week</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Adherence (30 Days)</span>
                      <span className="text-orange-500">60%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-orange-500 font-medium flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> Missed last week's dose.
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Recovery Monitoring Timeline */}
          <SectionCard title="Recovery Monitoring" subtitle="Post-Treatment tracking" icon={TrendingUp}>
            <div className="relative border-l border-border ml-3 space-y-6 pb-2">
              
              {/* Event 1 */}
              <div className="relative pl-6">
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-success flex items-center justify-center text-white ring-4 ring-background"><CheckCircle2 className="w-3 h-3"/></div>
                <div className="text-xs font-bold text-success uppercase tracking-wider mb-1">Day 1 (Post-Op)</div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <h4 className="text-sm font-semibold mb-1">Discharged & Stable</h4>
                  <p className="text-xs text-muted-foreground">Patient discharged with instructions for wound care. Prescribed antibiotics.</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative pl-6">
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-background"><Activity className="w-3 h-3"/></div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Day 3 (Current)</div>
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold">AI Symptom Check-in</h4>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Automated</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Patient reported mild pain (4/10). No fever or signs of infection.</p>
                  <div className="flex gap-2">
                    <button className="text-[10px] font-semibold px-2 py-1 rounded bg-background border border-border hover:bg-muted transition-colors">View Chat</button>
                    <button className="text-[10px] font-semibold px-2 py-1 rounded bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-colors">Acknowledge</button>
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative pl-6">
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground ring-4 ring-background"><Clock className="w-3 h-3"/></div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Day 7 (Upcoming)</div>
                <div className="p-3 rounded-xl border border-border bg-card opacity-60">
                  <h4 className="text-sm font-semibold mb-1">Follow-up Appointment</h4>
                  <p className="text-xs text-muted-foreground">In-person suture removal and assessment.</p>
                </div>
              </div>

            </div>
          </SectionCard>


        </div>

        {/* Right Col: AI Health Coach & Guidance */}
        <div className="space-y-6">
          
          {/* Personalized Care Guidance */}
          <SectionCard title="Care Guidance" subtitle="AI-generated plan for the patient" icon={UserCheck}>
            <div className="text-sm space-y-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-900 dark:text-blue-200 border border-blue-500/20">
                <span className="font-bold block mb-1">Dietary Target:</span>
                Increase fiber intake to 25g/day to assist with metabolic health. Suggest Mediterranean diet patterns.
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-900 dark:text-purple-200 border border-purple-500/20">
                <span className="font-bold block mb-1">Exercise Goal:</span>
                150 minutes of moderate aerobic activity weekly. Patient prefers brisk walking and yoga.
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border border-emerald-500/20">
                <span className="font-bold block mb-1">Next Milestone:</span>
                HbA1c test due in 3 weeks. Aiming for &lt; 6.5%.
              </div>
            </div>
          </SectionCard>

          {/* AI Health Coach Chat */}
          <SectionCard title="AI Health Coach log" subtitle="Recent automated interactions" icon={MessageSquare}>
            <div className="flex flex-col h-[300px]">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin mb-3">
                {chat.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'btn-glossy text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={sendMessage} className="flex gap-2 relative mt-auto">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type as doctor to override AI coach..." 
                  className="flex-1 pl-4 pr-10 py-2.5 rounded-xl bg-muted/60 border border-border focus:bg-card focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
