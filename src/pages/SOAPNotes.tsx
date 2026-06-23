import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits"
import { FileText, Loader2, RefreshCw, Send, Edit3, CheckCircle, Stethoscope, Calendar, Users, Mic, Globe } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { fmtDate, fmtDateTime12 } from "@/lib/format"

interface SOAPNote {
  id: string
  appointment_id: string
  patient_id: string
  doctor_id: string
  subjective: string[]
  objective: string[]
  assessment: string[]
  plan: string[]
  ai_generated: boolean
  reviewed_by_doctor: boolean
  created_at: string
}

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string
  condition_tags: string[]
  patients: {
    full_name: string
    avatar_url?: string
  }
  doctors: {
    full_name: string
    specialty?: string
  }
  auto_soap_notes?: SOAPNote
}

export default function SOAPNotes() {
  const queryClient = useQueryClient()
  const [selectedNote, setSelectedNote] = useState<SOAPNote | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [dictationLanguage, setDictationLanguage] = useState("English")
  const [soapData, setSoapData] = useState({
    subjective: [] as string[],
    objective: [] as string[],
    assessment: [] as string[],
    plan: [] as string[]
  })

const { data: appointments, isLoading } = useQuery({
    queryKey: ["booked-appointments"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients:patient_id (full_name, avatar_url),
          doctors:doctor_id (full_name, specialty),
          auto_soap_notes:appointment_id (*)
        `)
        .eq("status", "Booked")
        .gte("appointment_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
      
      if (error) throw error
      return data as Appointment[]
    }
  })

  const { data: stats } = useQuery({
    queryKey: ["soap-stats"],
    queryFn: async () => {
      const { data: allNotes, error } = await supabase
        .from("auto_soap_notes")
        .select("*")
      
      if (error) throw error
      
      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - 7)
      
      return {
        total: allNotes?.length || 0,
        pending: allNotes?.filter(n => !n.reviewed_by_doctor).length || 0,
        edited: allNotes?.filter(n => !n.ai_generated).length || 0,
        thisWeek: allNotes?.filter(n => new Date(n.created_at) >= thisWeek).length || 0
      }
    }
  })

  const generateSOAPNote = async (apt: Appointment) => {
    setIsGenerating(true)
    const patientName = apt.patients?.full_name || "Unknown"
    const conditionTags = apt.condition_tags?.join(", ") || "not specified"
    const aptNotes = apt.notes || "no additional notes"
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          mode: "chat",
          systemPrompt: "You are a professional clinical assistant. Generate a SOAP note based on the consultation details provided. Your response must be a single, valid JSON object containing exactly the keys: subjective (array of strings), objective (array of strings), assessment (array of strings), plan (array of strings). Do not include any conversational text or markdown wrappers.",
          question: `Generate a SOAP note for this consultation. Patient: ${patientName}. Condition: ${conditionTags}. Notes: ${aptNotes}. Return ONLY valid JSON in this format: {subjective, objective, assessment, plan} where each is a string array of bullet points.`,
          context: { patientId: apt.patient_id }
        }
      })

      if (error) throw error

      const aiAnswer = data?.answer || (typeof data === "string" ? data : "")

      const cleanJsonString = (str: string) => {
        return str.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      };

      let parsed: {subjective: string[], objective: string[], assessment: string[], plan: string[]}
      
      try {
        parsed = JSON.parse(cleanJsonString(aiAnswer))
      } catch {
        parsed = {
          subjective: ["Patient presented with reported symptoms"],
          objective: ["Clinical examination performed"],
          assessment: ["Condition assessed based on findings"],
          plan: ["Treatment plan recommended"]
        }
      }

      const { data: note, error: insertError } = await supabase
        .from("auto_soap_notes")
        .insert({
          appointment_id: apt.id,
          patient_id: apt.patient_id,
          doctor_id: apt.doctor_id,
          subjective: parsed.subjective || [],
          objective: parsed.objective || [],
          assessment: parsed.assessment || [],
          plan: parsed.plan || [],
          ai_generated: true,
          reviewed_by_doctor: false
        })
        .select()
        .single()

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ["completed-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["soap-stats"] })
      toast.success("SOAP note generated successfully")
      
      setSelectedAppointment(apt)
      setSoapData({
        subjective: parsed.subjective || [],
        objective: parsed.objective || [],
        assessment: parsed.assessment || [],
        plan: parsed.plan || []
      })
      setSelectedNote(note)
    } catch (error) {
      toast.error("Failed to generate SOAP note")
    } finally {
      setIsGenerating(false)
    }
  }

  const simulateDictation = (apt: Appointment) => {
    setIsDictating(true)
    toast.info(`Listening in ${dictationLanguage}...`, { duration: 3000 })
    setTimeout(() => {
      setIsDictating(false)
      generateSOAPNote({
        ...apt,
        notes: `[Dictated in ${dictationLanguage}] Patient presents with acute lower back pain radiating to the left leg. Pain is 7/10. No numbness. Recommend MRI and physical therapy.`
      })
    }, 3000)
  }

  const viewNotes = (apt: Appointment) => {
    if (apt.auto_soap_notes) {
      setSelectedAppointment(apt)
      setSelectedNote(apt.auto_soap_notes)
      setSoapData({
        subjective: apt.auto_soap_notes.subjective || [],
        objective: apt.auto_soap_notes.objective || [],
        assessment: apt.auto_soap_notes.assessment || [],
        plan: apt.auto_soap_notes.plan || []
      })
    }
  }

  const handleInputChange = (section: string, value: string) => {
    setSoapData(prev => ({
      ...prev,
      [section]: value.split("\n").filter(line => line.trim())
    }))
  }

  const saveNote = async () => {
    if (!selectedNote) return
    
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("auto_soap_notes")
        .update({
          subjective: soapData.subjective,
          objective: soapData.objective,
          assessment: soapData.assessment,
          plan: soapData.plan,
          reviewed_by_doctor: true
        })
        .eq("id", selectedNote.id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["completed-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["soap-stats"] })
      toast.success("Note saved and approved")
      setSelectedNote(null)
    } catch (error) {
      toast.error("Failed to save note")
    } finally {
      setIsSaving(false)
    }
  }

  const regenerateNote = async () => {
    if (!selectedAppointment) return
    await generateSOAPNote(selectedAppointment)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="SOAP Notes"
        subtitle="Auto-generate structured clinical notes after every consult"
        icon={<FileText className="h-6 w-6" />}
        gradientFrom="cyan-500"
        gradientTo="blue-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SectionCard className="glass-card glow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Notes Generated</p>
              <p className="text-2xl font-bold gradient-text">{stats?.total || 0}</p>
            </div>
            <FileText className="h-8 w-8 muted" />
          </div>
        </SectionCard>
        <SectionCard className="glass-card glow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold gradient-text">{stats?.pending || 0}</p>
            </div>
            <Edit3 className="h-8 w-8 muted" />
          </div>
        </SectionCard>
        <SectionCard className="glass-card glow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Manually Edited</p>
              <p className="text-2xl font-bold gradient-text">{stats?.edited || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 muted" />
          </div>
        </SectionCard>
        <SectionCard className="glass-card glow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold gradient-text">{stats?.thisWeek || 0}</p>
            </div>
            <Calendar className="h-8 w-8 muted" />
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        {appointments?.map((apt) => {
          const note = apt.auto_soap_notes
          const noteStatus = note 
            ? note.reviewed_by_doctor 
              ? (note.ai_generated ? "Generated" : "Manually Edited")
              : "Generated"
            : "Pending"
          
          return (
            <SectionCard key={apt.id} className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {apt.patients?.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg foreground">{apt.patients?.full_name}</h3>
                    <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {fmtDate(apt.appointment_date)} at {apt.appointment_time}
                      </span>
                      <span className="flex items-center">
                        <Stethoscope className="h-4 w-4 mr-1" />
                        {apt.doctors?.full_name}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusPill variant={noteStatus.toLowerCase().replace(" ", "-")}>
                  {noteStatus}
                </StatusPill>
              </div>
              
              <div className="mt-4 flex gap-2">
                {note ? (
                  <button
                    onClick={() => viewNotes(apt)}
                    className="btn-glossy px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Notes
                  </button>
                ) : (
                  <button
                    onClick={() => generateSOAPNote(apt)}
                    disabled={isGenerating || isDictating}
                    className="btn-glossy px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Generate Notes
                  </button>
                )}
                {!note && (
                   <div className="flex items-center gap-2 border border-border rounded-lg px-2 bg-muted/30">
                     <Globe className="h-4 w-4 text-muted-foreground" />
                     <select 
                       value={dictationLanguage} 
                       onChange={(e) => setDictationLanguage(e.target.value)}
                       className="bg-transparent text-sm border-none focus:ring-0 p-1 outline-none"
                     >
                       <option>English</option>
                       <option>Spanish</option>
                       <option>Hindi</option>
                       <option>French</option>
                     </select>
                     <button
                       onClick={() => simulateDictation(apt)}
                       disabled={isDictating || isGenerating}
                       className={`p-2 rounded-md transition-colors ${isDictating ? 'bg-red-500 text-white animate-pulse' : 'text-primary hover:bg-primary/10'}`}
                       title="Dictate Consultation"
                     >
                       <Mic className="h-4 w-4" />
                     </button>
                   </div>
                )}
              </div>
            </SectionCard>
          )
        })}
      </div>

      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SectionCard className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">SOAP Note</h2>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="btn-glossy px-3 py-1 rounded"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <SectionCard className="border-l-4 border-cyan-500 p-4">
                  <label className="font-semibold text-cyan-500 mb-2 block">S - Subjective</label>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg border scrollbar-thin"
                    value={soapData.subjective.join("\n")}
                    onChange={(e) => handleInputChange("subjective", e.target.value)}
                    placeholder="Patient reported symptoms..."
                    readOnly={selectedNote.reviewed_by_doctor}
                  />
                </SectionCard>

                <SectionCard className="border-l-4 border-blue-500 p-4">
                  <label className="font-semibold text-blue-500 mb-2 block">O - Objective</label>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg border scrollbar-thin"
                    value={soapData.objective.join("\n")}
                    onChange={(e) => handleInputChange("objective", e.target.value)}
                    placeholder="Clinical findings..."
                    readOnly={selectedNote.reviewed_by_doctor}
                  />
                </SectionCard>

                <SectionCard className="border-l-4 border-purple-500 p-4">
                  <label className="font-semibold text-purple-500 mb-2 block">A - Assessment</label>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg border scrollbar-thin"
                    value={soapData.assessment.join("\n")}
                    onChange={(e) => handleInputChange("assessment", e.target.value)}
                    placeholder="Diagnosis..."
                    readOnly={selectedNote.reviewed_by_doctor}
                  />
                </SectionCard>

                <SectionCard className="border-l-4 border-green-500 p-4">
                  <label className="font-semibold text-green-500 mb-2 block">P - Plan</label>
                  <textarea
                    className="w-full min-h-[100px] p-3 rounded-lg border scrollbar-thin"
                    value={soapData.plan.join("\n")}
                    onChange={(e) => handleInputChange("plan", e.target.value)}
                    placeholder="Treatment plan..."
                    readOnly={selectedNote.reviewed_by_doctor}
                  />
                </SectionCard>
              </div>

              <div className="flex gap-2 mt-6">
                {!selectedNote.reviewed_by_doctor && (
                  <button
                    onClick={saveNote}
                    disabled={isSaving}
                    className="btn-glossy px-6 py-2 rounded-lg flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve & Save
                  </button>
                )}
                <button
                  onClick={regenerateNote}
                  disabled={isGenerating}
                  className="btn-glossy px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
