import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits"
import { Activity, AlertTriangle, TrendingUp, Heart, Plus, Loader2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { fmtDate } from "@/lib/format"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface ChronicRiskPlan {
  id: string
  patient_id: string
  condition_type: string
  risk_score: number
  risk_category: "Critical" | "High" | "Moderate" | "Low"
  trend_direction: "rising" | "stable" | "improving"
  ai_alerts: string[] | null
  monitoring_frequency: string
  last_assessment: string
  patients?: {
    first_name: string
    last_name: string
    last_visit: string
  }
}

const conditionOptions = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid", "Arthritis"]

export default function ChronicRiskMonitor() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [conditionType, setConditionType] = useState("")
  const [monitoringFreq, setMonitoringFreq] = useState("monthly")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: riskPlans = [], isLoading } = useQuery({
    queryKey: ["chronic-risk-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chronic_risk_plans")
        .select(`*, patients(first_name, last_name, last_visit)`)
        .order("last_assessment", { ascending: false })
      if (error) throw error
      return data as ChronicRiskPlan[]
    }
  })

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-for-risk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .eq("is_chronic", true)
      if (error) throw error
      return data || []
    }
  })

  const summary = {
    totalPatients: riskPlans.length,
    highRisk: riskPlans.filter(p => p.risk_category === "High" || p.risk_category === "Critical").length,
    alertsActive: riskPlans.filter(p => p.ai_alerts && p.ai_alerts.length > 0).length,
    avgRiskScore: riskPlans.length ? Math.round(riskPlans.reduce((sum, p) => sum + p.risk_score, 0) / riskPlans.length) : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !conditionType) return

    setIsSubmitting(true)
    const riskScore = Math.floor(Math.random() * 100)
    const categories: ("Critical" | "High" | "Moderate" | "Low")[] = ["Critical", "High", "Moderate", "Low"]
    const category = categories[Math.floor(riskScore / 25)]
    const trends: ("rising" | "stable" | "improving")[] = ["rising", "stable", "improving"]
    const trend = trends[Math.floor(Math.random() * 3)]

    const { error } = await supabase.from("chronic_risk_plans").insert({
      patient_id: selectedPatient,
      condition_type: conditionType,
      risk_score: riskScore,
      risk_category: category,
      trend_direction: trend,
      monitoring_frequency: monitoringFreq,
      last_assessment: new Date().toISOString()
    })

    if (error) {
      toast.error("Failed to create risk plan")
    } else {
      toast.success("Risk plan created successfully")
      queryClient.invalidateQueries({ queryKey: ["chronic-risk-plans"] })
      setShowModal(false)
      setSelectedPatient("")
      setConditionType("")
      setMonitoringFreq("monthly")
    }
    setIsSubmitting(false)
  }

  const getRiskColor = (category: string) => {
    switch (category) {
      case "Critical": return "destructive"
      case "High": return "warning"
      case "Moderate": return "primary"
      default: return "success"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising": return <ArrowUp className="w-3 h-3 text-destructive" />
      case "improving": return <ArrowDown className="w-3 h-3 text-success" />
      default: return <span className="text-muted-foreground">→</span>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-muted rounded shimmer w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 glass-card shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 glass-card shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 scrollbar-thin">
      <PageHeader
        title="Chronic Risk Monitor"
        subtitle="Track & manage chronic-condition patients — AI-flagged trends and alerts"
        icon={<Heart className="w-5 h-5" />}
        gradient="from-rose-500 to-red-500"
      />

      <div className="flex justify-between items-center">
        <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
          <SectionCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalPatients}</p>
                <p className="text-sm muted-foreground">Total Chronic Patients</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.highRisk}</p>
                <p className="text-sm muted-foreground">High Risk</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.alertsActive}</p>
                <p className="text-sm muted-foreground">Alerts Active</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Heart className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.avgRiskScore}</p>
                <p className="text-sm muted-foreground">Avg Risk Score</p>
              </div>
            </div>
          </SectionCard>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-glossy flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Risk Plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {riskPlans.map((plan) => (
          <div key={plan.id} className="glass-card glow-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold">
                  {plan.patients?.first_name?.[0]}{plan.patients?.last_name?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{plan.patients?.first_name} {plan.patients?.last_name}</h3>
                  <p className="text-sm muted-foreground">Last visit: {fmtDate(plan.patients?.last_visit)}</p>
                </div>
              </div>
              <StatusPill variant={getRiskColor(plan.risk_category) as any}>
                {plan.risk_category}
              </StatusPill>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">{plan.condition_type}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-muted"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${plan.risk_score}, 100`}
                    className={plan.risk_score >= 70 ? "text-destructive" : plan.risk_score >= 40 ? "text-warning" : "text-success"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{plan.risk_score}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs muted-foreground">Risk Score</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  {getTrendIcon(plan.trend_direction)}
                  <span className="text-xs muted-foreground capitalize">{plan.trend_direction}</span>
                </div>
              </div>
            </div>

            {plan.ai_alerts && plan.ai_alerts.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-destructive mb-1">AI Alerts</p>
                <ul className="text-xs muted-foreground space-y-0.5">
                  {plan.ai_alerts.slice(0, 2).map((alert, i) => (
                    <li key={i}>• {alert}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs muted-foreground">
                Last assessed: {fmtDate(plan.last_assessment)}
              </span>
              <span className="px-2 py-1 text-xs rounded bg-muted">{plan.monitoring_frequency}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-semibold">Add Risk Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition Type</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">Select condition</option>
                  {conditionOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monitoring Frequency</label>
                <select
                  value={monitoringFreq}
                  onChange={(e) => setMonitoringFreq(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-glossy disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}