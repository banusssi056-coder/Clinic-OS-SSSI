import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { PageHeader, SectionCard } from "@/components/ui-bits"
import { Heart, Plus, Activity, Thermometer, Droplets, Scale, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

interface WellnessLog {
  id: string
  patient_id: string
  log_date: string
  bp_systolic: number | null
  bp_diastolic: number | null
  heart_rate: number | null
  weight: number | null
  blood_sugar_fasting: number | null
  notes: string | null
  created_at: string
  patients: {
    id: string
    first_name: string
    last_name: string
  }
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

const WellnessTracking = () => {
  const queryClient = useQueryClient()
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [modalOpen, setModalOpen] = useState(false)
  const [calDateOpen, setCalDateOpen] = useState(false)
  const [formDate, setFormDate] = useState<Date>(new Date())
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [weight, setWeight] = useState("")
  const [bloodSugar, setBloodSugar] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .order("first_name")
      if (error) throw error
      return data as Patient[]
    },
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["wellness-logs", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return []
      const { data, error } = await supabase
        .from("wellness_logs")
        .select(`
          *,
          patients(id, first_name, last_name)
        `)
        .eq("patient_id", selectedPatientId)
        .order("log_date", { ascending: false })
        .limit(100)
      if (error) throw error
      return data as WellnessLog[]
    },
    enabled: !!selectedPatientId,
  })

  const patient = patients?.find((p) => p.id === selectedPatientId)

  const kpiData = {
    totalLogs: logs?.length || 0,
    avgBP: (() => {
      const valid = logs?.filter((l) => l.bp_systolic && l.bp_diastolic) || []
      if (valid.length === 0) return "—"
      const avgS = valid.reduce((s, l) => s + (l.bp_systolic || 0), 0) / valid.length
      const avgD = valid.reduce((s, l) => s + (l.bp_diastolic || 0), 0) / valid.length
      return `${Math.round(avgS)}/${Math.round(avgD)}`
    })(),
    avgHR: (() => {
      const valid = logs?.filter((l) => l.heart_rate) || []
      if (valid.length === 0) return "—"
      const avg = valid.reduce((s, l) => s + (l.heart_rate || 0), 0) / valid.length
      return `${Math.round(avg)} bpm`
    })(),
    patientsTracking: patients?.length || 0,
  }

  const chartData = logs?.slice(0, 30).reverse().map((log, idx) => {
    const label = format(new Date(log.log_date), "MM/dd")
    return {
      label,
      bp_systolic: log.bp_systolic,
      bp_diastolic: log.bp_diastolic,
      heart_rate: log.heart_rate,
      weight: log.weight,
      blood_sugar_fasting: log.blood_sugar_fasting,
    }
  }) || []

  const resetForm = () => {
    setFormDate(new Date())
    setSystolic("")
    setDiastolic("")
    setHeartRate("")
    setWeight("")
    setBloodSugar("")
    setNotes("")
    setCalDateOpen(false)
  }

  const handleSaveEntry = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient first.")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from("wellness_logs").insert({
        patient_id: selectedPatientId,
        log_date: format(formDate, "yyyy-MM-dd"),
        bp_systolic: systolic ? Number(systolic) : null,
        bp_diastolic: diastolic ? Number(diastolic) : null,
        heart_rate: heartRate ? Number(heartRate) : null,
        weight: weight ? Number(weight) : null,
        blood_sugar_fasting: bloodSugar ? Number(bloodSugar) : null,
        notes: notes || null,
      })
      if (error) throw error
      toast.success("Wellness log entry saved!")
      resetForm()
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["wellness-logs", selectedPatientId] })
    } catch (error: any) {
      toast.error(error.message || "Failed to save entry.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wellness Tracking"
        subtitle="Monitor patient vitals & wellness metrics over time"
        icon={Heart}
        gradient="from-pink-500 to-rose-500"
      />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-muted border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">Select a patient</option>
            {patients?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true) }}
          className="btn-glossy bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:scale-[1.02] transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Log Entry
        </button>
      </div>

      {!selectedPatientId ? (
        <SectionCard>
          <div className="py-16 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select a patient to view wellness tracking data.</p>
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Logs This Month", value: kpiData.totalLogs.toString(), icon: CalendarIcon, color: "from-blue-500 to-cyan-400" },
              { label: "Avg Blood Pressure", value: kpiData.avgBP, icon: Activity, color: "from-rose-500 to-pink-400" },
              { label: "Avg Heart Rate", value: kpiData.avgHR, icon: Thermometer, color: "from-orange-500 to-amber-400" },
              { label: "Patients Tracking", value: kpiData.patientsTracking.toString(), icon: Droplets, color: "from-emerald-500 to-teal-400" },
            ].map((kpi, i) => (
              <SectionCard key={i} className="relative overflow-hidden group glow-card">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${kpi.color} opacity-10 -translate-y-1/2 translate-x-1/2`} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mt-1">{kpi.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.color} shadow-lg`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>

          <SectionCard title={`Vitals for ${patient ? `${patient.first_name} ${patient.last_name}` : "Patient"}`}>
            {logsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No wellness data available yet.
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="label" stroke="#ffffff50" fontSize={12} />
                    <YAxis stroke="#ffffff50" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(20,20,35,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bp_systolic" stroke="#f43f5e" strokeWidth={2} name="BP Systolic" dot={false} />
                    <Line type="monotone" dataKey="bp_diastolic" stroke="#fb7185" strokeWidth={2} name="BP Diastolic" dot={false} />
                    <Line type="monotone" dataKey="heart_rate" stroke="#f97316" strokeWidth={2} name="Heart Rate" dot={false} />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} name="Weight (kg)" dot={false} />
                    <Line type="monotone" dataKey="blood_sugar_fasting" stroke="#10b981" strokeWidth={2} name="Blood Sugar" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recent Logs">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : logs?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No logs recorded yet.</div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Blood Pressure</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Heart Rate</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Weight</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Blood Sugar</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs?.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                          {format(new Date(log.log_date), "MMM dd, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {log.bp_systolic && log.bp_diastolic
                            ? `${log.bp_systolic}/${log.bp_diastolic}`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {log.heart_rate ? `${log.heart_rate} bpm` : "—"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {log.weight ? `${log.weight} kg` : "—"}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {log.blood_sugar_fasting ? `${log.blood_sugar_fasting} mg/dL` : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground italic max-w-[200px] truncate">
                          {log.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#141428] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold gradient-text">Log New Entry</h2>
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
              <Popover open={calDateOpen} onOpenChange={setCalDateOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center gap-2 px-4 py-3 bg-muted border border-border rounded-xl text-foreground hover:border-primary transition-colors text-left">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    {format(formDate, "PPP")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#141428] border border-white/10 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={formDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormDate(date)
                        setCalDateOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Systolic BP</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="120"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Diastolic BP</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="80"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Blood Sugar (fasting)</label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  placeholder="mg/dL"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Heart Rate (bpm)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="72"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about this entry..."
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                disabled={saving}
                className="btn-glossy bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WellnessTracking
