import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits"
import { Pill, Plus, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { fmtDate, inr } from "@/lib/format"

interface Patient {
  id: string
  full_name: string
  avatar_url?: string
}

interface MedicationAdherence {
  id: string
  patient_id: string
  medication_name: string
  dosage: string
  frequency: string
  doses_taken: number
  doses_missed: number
  adherence_rate: number
  next_dose_time?: string
  prescribed_by?: string
  created_at: string
  patients?: Patient
}

const fetchMedications = async (): Promise<MedicationAdherence[]> => {
  const { data, error } = await supabase
    .from("medication_adherence")
    .select(`*, patients(id, full_name, avatar_url)`)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

const fetchPatients = async (): Promise<Patient[]> => {
  const { data, error } = await supabase
    .from("patients")
    .select("id, full_name, avatar_url")
    .order("full_name")
  if (error) throw error
  return data || []
}

export default function MedicationAdherence() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<MedicationAdherence | null>(null)
  const [doseStatus, setDoseStatus] = useState<"taken" | "missed">("taken")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: medications, isLoading, error } = useQuery({
    queryKey: ["medication-adherence"],
    queryFn: fetchMedications,
  })

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  })

  const summary = medications?.reduce(
    (acc, med) => ({
      total: acc.total + 1,
      totalTaken: acc.totalTaken + med.doses_taken,
      totalMissed: acc.totalMissed + med.doses_missed,
      lowAdherence: acc.lowAdherence + (med.adherence_rate < 70 ? 1 : 0),
    }),
    { total: 0, totalTaken: 0, totalMissed: 0, lowAdherence: 0 }
  ) || { total: 0, totalTaken: 0, totalMissed: 0, lowAdherence: 0 }

  const overallAdherence = summary.totalTaken + summary.totalMissed > 0
    ? Math.round((summary.totalTaken / (summary.totalTaken + summary.totalMissed)) * 100)
    : 0

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return "from-success to-green-600"
    if (rate >= 50) return "from-warning to-amber-600"
    return "from-destructive to-red-600"
  }

  const getRingColor = (rate: number) => {
    if (rate >= 80) return "text-success"
    if (rate >= 50) return "text-warning"
    return "text-destructive"
  }

  const handleLogDose = async () => {
    if (!selectedMedication) return
    setIsSubmitting(true)
    try {
      const updates = doseStatus === "taken"
        ? { doses_taken: selectedMedication.doses_taken + 1 }
        : { doses_missed: selectedMedication.doses_missed + 1 }

      const newTaken = doseStatus === "taken" ? selectedMedication.doses_taken + 1 : selectedMedication.doses_taken
      const newMissed = doseStatus === "missed" ? selectedMedication.doses_missed + 1 : selectedMedication.doses_missed
      const newRate = Math.round((newTaken / (newTaken + newMissed)) * 100)

      const { error } = await supabase
        .from("medication_adherence")
        .update({
          ...updates,
          adherence_rate: newRate,
        })
        .eq("id", selectedMedication.id)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ["medication-adherence"] })
      toast.success(`Dose marked as ${doseStatus}`)
      setIsModalOpen(false)
      setNotes("")
    } catch (err) {
      toast.error("Failed to log dose")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickMark = async (med: MedicationAdherence, status: "taken" | "missed") => {
    try {
      const updates = status === "taken"
        ? { doses_taken: med.doses_taken + 1 }
        : { doses_missed: med.doses_missed + 1 }

      const newTaken = status === "taken" ? med.doses_taken + 1 : med.doses_taken
      const newMissed = status === "missed" ? med.doses_missed + 1 : med.doses_missed
      const newRate = Math.round((newTaken / (newTaken + newMissed)) * 100)

      const { error } = await supabase
        .from("medication_adherence")
        .update({ ...updates, adherence_rate: newRate })
        .eq("id", med.id)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ["medication-adherence"] })
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(`Failed to mark as ${status}`)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Error loading medications</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Medication Adherence"
        subtitle="Track prescription compliance across patients"
        icon={<Pill className="h-6 w-6" />}
        gradientFrom="from-amber-500"
        gradientTo="to-orange-500"
      />

      <div className="flex justify-end">
        <button
          onClick={() => {
            setSelectedMedication(null)
            setIsModalOpen(true)
          }}
          className="btn-glossy flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Medication
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm muted-foreground">Total Active Medications</div>
          <div className="text-2xl font-bold">{summary.total}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm muted-foreground">Adherence Rate</div>
          <div className="text-2xl font-bold">{overallAdherence}%</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm muted-foreground">Low Adherence</div>
          <div className="text-2xl font-bold text-destructive">{summary.lowAdherence}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm muted-foreground">Missed Doses</div>
          <div className="text-2xl font-bold">{summary.totalMissed}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 shimmer h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scrollbar-thin">
          {medications?.map((med) => (
            <div key={med.id} className="glow-card p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border`}>
                    {med.patients?.avatar_url ? (
                      <img src={med.patients.avatar_url} alt={med.patients.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-semibold">
                        {med.patients?.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{med.medication_name}</h3>
                    <p className="text-sm muted-foreground">{med.patients?.full_name}</p>
                  </div>
                </div>
                <StatusPill
                  status={med.adherence_rate >= 80 ? "success" : med.adherence_rate >= 50 ? "warning" : "destructive"}
                  text={med.adherence_rate >= 80 ? "Good" : med.adherence_rate >= 50 ? "Needs Attention" : "Critical"}
                />
              </div>

              <div className="text-sm muted-foreground">
                {med.dosage} • {med.frequency}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${getRingColor(med.adherence_rate)}`}
                    style={{
                      background: `conic-gradient(${getAdherenceColor(med.adherence_rate).replace("from-", "").replace(" to-", " ")} ${med.adherence_rate * 3.6}deg, transparent 0deg)`,
                      borderRadius: "50%",
                      padding: "4px",
                    }}
                  >
                    <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">{med.adherence_rate}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm muted-foreground">Doses</div>
                  <div className="font-semibold">
                    {med.doses_taken} / {med.doses_taken + med.doses_missed}
                  </div>
                </div>
              </div>

              {med.next_dose_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 muted" />
                  <span className="muted-foreground">Next: {fmtDate(med.next_dose_time)}</span>
                </div>
              )}

              {med.prescribed_by && (
                <div className="text-xs muted-foreground">
                  Prescribed by: {med.prescribed_by}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleQuickMark(med, "taken")}
                  className="flex-1 btn-glossy text-success"
                >
                  Mark Taken
                </button>
                <button
                  onClick={() => handleQuickMark(med, "missed")}
                  className="flex-1 btn-glossy text-destructive"
                >
                  Mark Missed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log Dose</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm muted-foreground">Medication</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedMedication?.id || ""}
                  onChange={(e) => {
                    const med = medications?.find((m) => m.id === e.target.value)
                    setSelectedMedication(med || null)
                  }}
                >
                  <option value="">Select medication</option>
                  {medications?.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.medication_name} - {med.patients?.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm muted-foreground">Status</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={doseStatus}
                  onChange={(e) => setDoseStatus(e.target.value as "taken" | "missed")}
                >
                  <option value="taken">Taken</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              <div>
                <label className="text-sm muted-foreground">Notes</label>
                <textarea
                  className="w-full mt-1 p-2 border rounded"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogDose}
                  disabled={isSubmitting || !selectedMedication}
                  className="flex-1 btn-glossy"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}