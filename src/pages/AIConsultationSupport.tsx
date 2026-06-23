import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits"
import { Bot, Activity, AlertTriangle, Stethoscope, Send, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { fmtDateTime12 } from "@/lib/format"

interface Patient {
  id: string
  name: string
  phone?: string | null
  dob?: string | null
  gender?: string | null
  tags?: string[]
  last_visit?: string | null
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  type: string
  status: string
  patients?: Patient
}

interface ConsultationSession {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  session_status: string
  started_at: string
  ai_context?: any
  chronic_risk_score?: number
  patients?: Patient
}

interface AISuggestion {
  id: string
  suspected_conditions: Array<{ name: string; probability: number }>
  recommended_tests: string[]
  recommended_medicines: Array<{ name: string; dosage: string }>
  notes: string
  created_at: string
}

interface ChronicRiskPlan {
  id: string
  patient_id: string
  risk_score: number
}

export default function AIConsultationSupport() {
  const queryClient = useQueryClient()
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null)
  const [showStartModal, setShowStartModal] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)

  const { data: doctor } = useQuery({
    queryKey: ["current-doctor"],
    queryFn: async () => {
      // Fetching the first doctor safely
      const { data } = await supabase.from("doctors").select("*").limit(1)
      return data?.[0] || null
    }
  })

  const { data: todaysAppointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["todays-appointments"],
    enabled: true,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, patient_id, doctor_id, scheduled_at, type, status, patients(id, name, phone, dob, gender, tags, last_visit)")
        .eq("status", "Booked")
        .order("scheduled_at", { ascending: false })
      return data as Appointment[] || []
    }
  })

  const { data: activeConsultation = null, isLoading: loadingActive } = useQuery({
    queryKey: ["active-consultation", doctor?.id],
    enabled: !!doctor?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("consultation_sessions")
        .select("*, patients(*)")
        .eq("doctor_id", doctor!.id)
        .eq("session_status", "Active")
        .maybeSingle()
      
      setActiveSession(data as ConsultationSession | null)
      return data as ConsultationSession | null
    }
  })

  const { data: aiSuggestions = [], refetch: refetchSuggestions } = useQuery({
    queryKey: ["ai-suggestions", activeSession?.id],
    enabled: !!activeSession?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_suggestions")
        .select("*")
        .eq("session_id", activeSession!.id)
        .order("created_at", { ascending: false })
      return data as AISuggestion[] || []
    }
  })

  const { data: chronicRisk } = useQuery({
    queryKey: ["chronic-risk", activeSession?.patient_id],
    enabled: !!activeSession?.patient_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("chronic_risk_plans")
        .select("*")
        .eq("patient_id", activeSession!.patient_id)
        .single()
      return data as ChronicRiskPlan | null
    }
  })

  const startConsultation = async (appointmentId: string) => {
    try {
      const appointment = todaysAppointments.find(a => a.id === appointmentId)
      if (!appointment) return
      
      const doctorId = doctor?.id || appointment.doctor_id
      if (!doctorId) {
        toast.error("No doctor associated with this appointment.")
        return
      }

      const { data, error } = await supabase
        .from("consultation_sessions")
        .insert({
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: doctorId,
          session_status: "Active"
        })
        .select()
        .single()

      if (error) throw error
      setActiveSession({ ...(data as ConsultationSession), patients: appointment.patients })
      setShowStartModal(false)
      queryClient.invalidateQueries({ queryKey: ["active-consultation"] })
      toast.success("Consultation started")
    } catch (error) {
      toast.error("Failed to start consultation")
    }
  }

  const endConsultation = async () => {
    if (!activeSession) return
    try {
      const { error } = await supabase
        .from("consultation_sessions")
        .update({ session_status: "Completed" })
        .eq("id", activeSession.id)
      
      if (error) throw error

      setActiveSession(null)
      queryClient.invalidateQueries({ queryKey: ["active-consultation"] })
      toast.success("Consultation ended")
    } catch (error: any) {
      console.error("End consultation error:", error)
      toast.error("Failed to end consultation: " + error.message)
    }
  }

  const analyzeSymptoms = async () => {
    if (!activeSession) return
    setIsAnalyzing(true)
    try {
      const context = {
        patient: activeSession.patients,
        appointment: todaysAppointments.find(a => a.id === activeSession.appointment_id)
      }
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          mode: "chat",
          systemPrompt: "You are a clinical consultation assistant. Analyze the patient context and answer the clinical query. You MUST format your response as a single, valid JSON object containing exactly the following keys: diagnoses (an array of objects with keys 'name' and 'probability' [number]), tests (an array of strings), medicines (an array of objects with keys 'name' and 'dosage'), and notes (a string representing additional clinical notes or summary). Do not include any markdown wrappers (like ```json) or conversational text outside the JSON object.",
          question: aiQuestion || "Given patient context, suggest possible diagnoses, tests, and medicines. Be concise and India-specific.",
          context
        }
      })

      if (error) throw error

      const aiAnswer = data?.answer || (typeof data === "string" ? data : "")

      const cleanJsonString = (str: string) => {
        return str.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      };

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(cleanJsonString(aiAnswer));
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        toast.error("Failed to parse AI suggestions");
      }

      await supabase
        .from("ai_suggestions")
        .insert({
          session_id: activeSession.id,
          suspected_conditions: parsedData.diagnoses || [],
          recommended_tests: parsedData.tests || [],
          recommended_medicines: parsedData.medicines || [],
          notes: parsedData.notes || ""
        })

      setAiQuestion("")
      refetchSuggestions()
      toast.success("AI analysis complete")
    } catch (error) {
      toast.error("AI analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (loadingActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader
        title="AI Consultation Support"
        subtitle="Real-time AI assistance during patient consultations"
        icon={<Bot className="h-6 w-6" />}
        gradientFrom="from-indigo-500"
        gradientTo="to-blue-500"
      />

      {activeSession && activeSession.patients ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <SectionCard title="Patient and Appointment Context">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white font-bold">
                    {activeSession.patients.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{activeSession.patients.name}</h3>
                    <p className="text-sm text-muted-foreground">Age: {activeSession.patients.dob ? new Date().getFullYear() - new Date(activeSession.patients.dob).getFullYear() : "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm"><span className="muted">Phone:</span> {activeSession.patients.phone || "—"}</p>
                </div>

                {activeSession.patients.tags && activeSession.patients.tags.length > 0 && (
                  <div>
                    <span className="muted text-xs">Conditions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeSession.patients.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-muted rounded-full text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {activeSession.patients.last_visit && (
                  <p className="text-sm"><span className="muted">Last Visit:</span> {fmtDateTime12(new Date(activeSession.patients.last_visit))}</p>
                )}

                {chronicRisk && (
                  <div className="p-3 glass-card rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-warning" />
                      <span className="font-medium">Chronic Risk Score</span>
                    </div>
                    <p className="text-2xl font-bold gradient-text">{chronicRisk.risk_score}%</p>
                  </div>
                )}

                <button
                  onClick={endConsultation}
                  className="w-full btn-glossy bg-destructive text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  End Consultation
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <SectionCard title="AI Suggestions">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask AI about patient symptoms..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={analyzeSymptoms}
                    disabled={isAnalyzing}
                    className="btn-glossy bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Ask
                  </button>
                </div>

                <button
                  onClick={analyzeSymptoms}
                  disabled={isAnalyzing}
                  className="w-full glow-card bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center justify-center gap-2 hover:from-indigo-500/20 hover:to-blue-500/20 transition-all"
                >
                  <Stethoscope className="h-4 w-4" />
                  Analyze Symptoms
                </button>

                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {aiSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No AI suggestions yet. Ask a question or analyze symptoms.
                    </div>
                  ) : (
                    aiSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="glass-card rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-foreground">AI Suggestion</h4>
                          <span className="text-xs text-muted-foreground">{fmtDateTime12(new Date(suggestion.created_at))}</span>
                        </div>

                        {suggestion.suspected_conditions.length > 0 && (
                          <div>
                            <span className="muted text-xs">Suspected Conditions:</span>
                            <ul className="mt-1 space-y-1">
                              {suggestion.suspected_conditions.map((cond, i) => (
                                <li key={i} className="flex justify-between text-sm">
                                  <span>{cond.name}</span>
                                  <StatusPill variant={cond.probability > 70 ? "success" : cond.probability > 40 ? "warning" : "info"}>
                                    {cond.probability}%
                                  </StatusPill>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {suggestion.recommended_tests.length > 0 && (
                          <div>
                            <span className="muted text-xs">Recommended Tests:</span>
                            <ul className="mt-1 space-y-1">
                              {suggestion.recommended_tests.map((test, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" className="rounded" />
                                  <span>{test}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {suggestion.recommended_medicines.length > 0 && (
                          <div>
                            <span className="muted text-xs">Recommended Medicines:</span>
                            <ul className="mt-1 space-y-1">
                              {suggestion.recommended_medicines.map((med, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" className="rounded" />
                                  <span>{med.name} - {med.dosage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {suggestion.notes && (
                          <div>
                            <button
                              onClick={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              {expandedSuggestion === suggestion.id ? "Hide" : "Show"} Notes
                            </button>
                            {expandedSuggestion === suggestion.id && (
                              <p className="text-sm text-muted-foreground mt-2">{suggestion.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Appointments</h2>
            <button
              onClick={() => setShowStartModal(true)}
              className="btn-glossy bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Start New Consultation
            </button>
          </div>

          {loadingAppointments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-lg p-4 shimmer h-32" />
              ))}
            </div>
          ) : todaysAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No booked appointments
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="glass-card rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-foreground">{appointment.patients?.name}</h3>
                    <StatusPill variant="info">{appointment.type}</StatusPill>
                  </div>
                   <p className="text-sm text-muted-foreground mb-2">
                     {fmtDateTime12(new Date(`${appointment.scheduled_at}`))}
                   </p>
                   {appointment.patients?.tags && appointment.patients.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {appointment.patients.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-muted rounded-full text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => startConsultation(appointment.id)}
                    className="w-full btn-glossy bg-success text-white py-2 rounded-lg text-sm"
                  >
                    Start Consultation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-lg p-6 w-full max-w-md">
<h3 className="text-lg font-semibold text-foreground mb-4">Select Appointment</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {todaysAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No booked appointments available</p>
              ) : (
                todaysAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => startConsultation(appointment.id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{appointment.patients?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDateTime12(new Date(`${appointment.scheduled_at}`))}
                    </p>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowStartModal(false)}
              className="w-full mt-4 border border-border py-2 rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
