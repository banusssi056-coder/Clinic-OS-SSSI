import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Users, Activity, HeartPulse, FileText } from "lucide-react";
import { useState } from "react";

export default function FamilyDashboard() {
  const [selectedFamily, setSelectedFamily] = useState("Smith Family");

  const families = [
    { name: "Smith Family", members: ["Sarah (28)", "John (34)", "Emma (5)"] },
    { name: "Patel Family", members: ["Raj (45)", "Priya (42)"] }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Health Dashboard"
        subtitle="Aggregate family vitals, history, and appointments"
        icon={Users}
        gradient="from-emerald-400 to-teal-500"
        actions={
          <select 
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {families.map(f => <option key={f.name}>{f.name}</option>)}
          </select>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Family Members" icon={Users}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {families.find(f => f.name === selectedFamily)?.members.map((member, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition cursor-pointer">
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg">
                    {member.charAt(0)}
                  </div>
                  <div className="font-semibold text-sm">{member}</div>
                  <div className="text-xs text-success">Healthy</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Combined Wellness Metrics" icon={Activity}>
             <div className="h-40 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
               Family health trends and aggregated analytics will appear here.
             </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Shared Appointments" icon={HeartPulse}>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="text-xs font-semibold text-primary mb-1">Tomorrow, 10:00 AM</div>
                <div className="text-sm font-medium">Emma - Pediatrics Routine</div>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card">
                <div className="text-xs font-semibold text-primary mb-1">Friday, 2:30 PM</div>
                <div className="text-sm font-medium">Sarah - Follow-up</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Family Medical History" icon={FileText}>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
              <li>History of Type 2 Diabetes (Paternal)</li>
              <li>No known drug allergies</li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
