import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { FileText, Loader2, RefreshCw, Send, CheckCircle, Clock, Users, Search, Calendar, Stethoscope, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, fmtDateTime12 } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  tags: string[] | null;
  last_visit: string | null;
  lifetime_value: number | null;
  status: string | null;
};

type Appointment = {
  id: string;
  scheduled_at: string;
  type: string | null;
  status: string;
  doctor_id: string | null;
  notes: string | null;
  patient_id: string;
  doctor_name?: string;
};

type SoapNote = {
  id: string;
  appointment_id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  created_at: string;
};

type ClinicalSummary = {
  id: string;
  patient_id: string;
  summary: string | null;
  key_findings: string[] | null;
  follow_up_recommendations: string[] | null;
  red_flags: string[] | null;
  reviewed_by_doctor: boolean | null;
  created_at: string;
};

type AiInsightsResponse = {
  summary?: string;
  key_findings?: string[];
  follow_up_recommendations?: string[];
  red_flags?: string[];
};

export default function ClinicalSummarization() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [latestSummary, setLatestSummary] = useState<ClinicalSummary | null>(null);

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id,name,phone,tags,last_visit,lifetime_value,status").order("name");
      if (error) throw error;
      return (data || []) as Patient[];
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id,scheduled_at,type,status,doctor_id,notes,patient_id,doctors!appointments_doctor_id_fkey(name)")
        .eq("patient_id", selectedPatient.id)
        .order("scheduled_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        doctor_name: a.doctors?.name || "—"
      })) as Appointment[];
    },
    enabled: !!selectedPatient,
  });

  const { data: soapNotes = {} } = useQuery({
    queryKey: ["soap-notes", appointments.map(a => a.id)],
    queryFn: async () => {
      if (appointments.length === 0) return {};
      const apptIds = appointments.map(a => a.id);
      const { data, error } = await supabase.from("auto_soap_notes").select("*").in("appointment_id", apptIds);
      if (error) throw error;
      const map: Record<string, SoapNote> = {};
      (data || []).forEach((sn: SoapNote) => { map[sn.appointment_id] = sn; });
      return map;
    },
    enabled: appointments.length > 0,
  });

  const { data: allSummaries = [], refetch: refetchSummaries } = useQuery({
    queryKey: ["clinical-summaries", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const { data, error } = await supabase
        .from("clinical_summaries")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClinicalSummary[];
    },
    enabled: !!selectedPatient,
  });

  const enrichedAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    return appointments.map((a) => {
      const sn = soapNotes[a.id];
      const soapSummary = sn
        ? (sn.subjective || sn.assessment || sn.plan)
          ? `${sn.subjective || ""}${sn.assessment ? " | Assessment: " + sn.assessment : ""}${sn.plan ? " | Plan: " + sn.plan : ""}`
          : sn.objective || null
        : null;
      return { ...a, soapSummary: soapSummary ? soapSummary.substring(0, 200) : null };
    });
  }, [appointments, soapNotes]);

  const visitFrequencyData = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const count = appointments.filter(
        (a) => {
          const ad = new Date(a.scheduled_at);
          return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        }
      ).length;
      months.push({ month: label, visits: count });
    }
    return months;
  }, [appointments]);

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone || "").includes(searchQuery)
    );
  }, [patients, searchQuery]);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient]);

  useEffect(() => {
    if (allSummaries.length > 0 && !latestSummary) {
      setLatestSummary(allSummaries[0]);
    }
  }, [allSummaries, latestSummary]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setShowDropdown(false);
    setLatestSummary(null);
  };

  const handleGenerateSummary = async () => {
    if (!selectedPatient) return;
    setGenerating(true);
    try {
      const recentAppointments = enrichedAppointments.slice(0, 5);
      const ctx = {
        patient: {
          name: selectedPatient.name,
          phone: selectedPatient.phone,
          tags: selectedPatient.tags,
          last_visit: selectedPatient.last_visit,
          lifetime_value: selectedPatient.lifetime_value,
          status: selectedPatient.status,
        },
        appointments: recentAppointments.map((a) => ({
          date: a.scheduled_at,
          type: a.type,
          status: a.status,
          soapSummary: a.soapSummary,
        })),
      };

      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          mode: "chat",
          systemPrompt: "You are a professional clinical assistant. Analyze the patient's visit history and notes to generate a comprehensive clinical summary. Your response must be a single, valid JSON object containing exactly the keys: summary (string), key_findings (array of strings), follow_up_recommendations (array of strings), red_flags (array of strings). Do not include any conversational text or markdown wrappers.",
          question: "Generate a comprehensive clinical summary for this patient. Include: chief complaints over time, diagnoses history, treatments given, response to treatments, key observations, red flags, and follow-up recommendations. Format as structured JSON with keys: summary, key_findings (array), follow_up_recommendations (array), red_flags (array).",
          context: ctx,
        },
      });

      if (error) throw error;

      const aiAnswer = data?.answer || (typeof data === "string" ? data : "");

      const cleanJsonString = (str: string) => {
        return str.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      };

      const parsed = JSON.parse(cleanJsonString(aiAnswer)) as AiInsightsResponse;
      if (!parsed || !parsed.summary) {
        throw new Error("Invalid response from AI");
      }

      const insertData = {
        patient_id: selectedPatient.id,
        summary: parsed.summary,
        key_findings: parsed.key_findings || [],
        follow_up_recommendations: parsed.follow_up_recommendations || [],
        red_flags: parsed.red_flags || [],
        reviewed_by_doctor: false,
      };

      const { error: insertError } = await supabase.from("clinical_summaries").insert([insertData]);
      if (insertError) throw insertError;

      toast.success("Clinical summary generated");
      refetchSummaries();
    } catch (e: any) {
      toast.error("Failed to generate summary: " + (e.message || e));
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkReviewed = async (summaryId: string) => {
    try {
      const { error } = await supabase.from("clinical_summaries").update({ reviewed_by_doctor: true }).eq("id", summaryId);
      if (error) throw error;
      toast.success("Marked as reviewed");
      refetchSummaries();
    } catch (e: any) {
      toast.error("Failed: " + (e.message || e));
    }
  };

  if (patientsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 shimmer rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-card rounded-2xl p-5 h-32 shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Summarization"
        subtitle="AI-powered patient history and visit summaries"
        icon={FileText}
        gradient="from-sky-500 to-indigo-500"
        actions={
          <button
            onClick={handleGenerateSummary}
            disabled={!selectedPatient || generating}
            className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Summary
          </button>
        }
      />

      <SectionCard title="Patient Search" subtitle="Select a patient to view their clinical summary" icon={Search}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search patients by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/60 border border-border focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          />
          {showDropdown && filteredPatients.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-thin">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-muted/80 transition flex items-center gap-3 ${selectedPatient?.id === p.id ? "bg-primary/10" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone || "No phone"} · {p.status || "No status"}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {selectedPatient ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-lg">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedPatient.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPatient.phone || "No phone"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(selectedPatient.tags || []).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full gradient-soft-bg border border-border font-medium">
                        {t}
                      </span>
                    ))}
                    {(!selectedPatient.tags || selectedPatient.tags.length === 0) && (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="glow-card rounded-2xl p-5 flex flex-col items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground mb-1" />
              <div className="text-2xl font-bold gradient-text">{enrichedAppointments.length}</div>
              <div className="text-xs text-muted-foreground font-medium">Total Visits</div>
            </div>
            <div className="glow-card rounded-2xl p-5 flex flex-col items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground mb-1" />
              <div className="text-2xl font-bold gradient-text">{selectedPatient.last_visit ? fmtDate(selectedPatient.last_visit) : "—"}</div>
              <div className="text-xs text-muted-foreground font-medium">Last Visit</div>
            </div>
          </div>

          {latestSummary && (
            <SectionCard
              title="Latest Clinical Summary"
              subtitle={`Generated ${latestSummary.created_at ? fmtDateTime12(latestSummary.created_at) : "—"}`}
              icon={Sparkles}
              action={
                !latestSummary.reviewed_by_doctor && (
                  <button
                    onClick={() => handleMarkReviewed(latestSummary.id)}
                    className="btn-glossy px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark as Reviewed
                  </button>
                )
              }
              className="border-success/30"
            >
              {latestSummary.reviewed_by_doctor && (
                <div className="flex items-center gap-2 text-success text-sm font-semibold mb-3">
                  <CheckCircle className="w-4 h-4" /> Reviewed by doctor
                </div>
              )}
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4">
                {latestSummary.summary || "No summary available."}
              </p>
              {(latestSummary.key_findings || []).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key Findings</h4>
                  <div className="flex flex-wrap gap-2">
                    {latestSummary.key_findings!.map((f, i) => (
                      <div key={i} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(latestSummary.follow_up_recommendations || []).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Follow-up Recommendations</h4>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {latestSummary.follow_up_recommendations!.map((r, i) => (
                      <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {(latestSummary.red_flags || []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Red Flags
                  </h4>
                  <div className="space-y-1.5">
                    {latestSummary.red_flags!.map((r, i) => (
                      <div key={i} className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Visit History" subtitle="Last 10 appointments" icon={Calendar}>
              {appointmentsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 shimmer rounded-xl" />)}
                </div>
              ) : enrichedAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointments found.</p>
              ) : (
                <div className="space-y-2">
                  {enrichedAppointments.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="w-10 h-10 rounded-lg gradient-soft-bg flex flex-col items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-primary">{new Date(a.scheduled_at).toLocaleDateString("en-IN", { day: "2-digit" })}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{new Date(a.scheduled_at).toLocaleDateString("en-IN", { month: "short" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{a.type || "Appointment"}</span>
                          <StatusPill value={a.status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(a.scheduled_at)}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {a.doctor_name || "—"}</span>
                        </div>
                        {a.soapSummary && (
                          <div className="mt-2 text-xs text-foreground/70 bg-muted/60 rounded-lg px-2.5 py-2 border-l-2 border-primary/30 line-clamp-2">
                            <Stethoscope className="inline w-3 h-3 mr-1 text-primary" />
                            {a.soapSummary}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Visit Frequency" subtitle="Last 6 months" icon={Calendar}>
              {visitFrequencyData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointment data.</p>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitFrequencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="visits" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>
        </>
      ) : (
        <SectionCard title="No Patient Selected" subtitle="Search and select a patient to view their clinical summary">
          <p className="text-muted-foreground text-sm py-4 text-center">Select a patient from the search bar above.</p>
        </SectionCard>
      )}
    </div>
  );
}
