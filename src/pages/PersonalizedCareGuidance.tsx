import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { Sparkles, RefreshCw, Loader2, Plus, CheckCircle, Target, AlertTriangle, Loader2 as Spinner } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { fmtDate } from "@/lib/format";

interface Patient {
  id: string;
  name: string;
  email?: string;
}

interface CareGuidance {
  id: string;
  patient_id: string;
  patient_name?: string;
  condition_tag: string;
  ai_generated_guidance: string;
  confidence_score: number;
  priority: string;
  status: string;
  expires_at?: string;
  created_at: string;
}

const fetchPatients = async (): Promise<Patient[]> => {
  const { data, error } = await supabase.from("patients").select("id, name, email").order("name");
  if (error) throw error;
  return data || [];
};

const fetchCareGuidance = async (): Promise<CareGuidance[]> => {
  const { data, error } = await supabase.from("care_guidance").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export default function PersonalizedCareGuidance() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [conditionTag, setConditionTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedPriority, setSelectedPriority] = useState("Medium");

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  const { data: guidance = [], isLoading: guidanceLoading, refetch } = useQuery({
    queryKey: ["care_guidance"],
    queryFn: fetchCareGuidance,
  });

  const activePlans = guidance.filter(g => g.status === "Active").length;
  const highPriority = guidance.filter(g => g.priority === "High" && g.status === "Active").length;
  const newThisWeek = guidance.filter(g => {
    const created = new Date(g.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;
  const avgConfidence = guidance.length > 0 
    ? Math.round(guidance.reduce((sum, g) => sum + g.confidence_score, 0) / guidance.length) 
    : 0;

  const handleGenerate = async () => {
    if (!selectedPatient || !conditionTag.trim()) {
      toast.error("Please select a patient and enter a condition");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          mode: "chat",
          question: `Generate a personalized care plan for patient with condition: ${conditionTag}. Include diet, exercise, follow-up frequency, lifestyle changes.`,
          context: { patientId: selectedPatient }
        }
      });

      if (error) throw error;

      const aiAnswer = data?.answer || data?.message || "No guidance generated";

      const { error: insertError } = await supabase.from("care_guidance").insert({
        patient_id: selectedPatient,
        condition_tag: conditionTag,
        ai_generated_guidance: aiAnswer,
        confidence_score: 85,
        priority: selectedPriority,
        status: "Active"
      });

      if (insertError) throw insertError;

      toast.success("Care guidance generated successfully");
      queryClient.invalidateQueries({ queryKey: ["care_guidance"] });
      setIsModalOpen(false);
      setSelectedPatient("");
      setConditionTag("");
      setSelectedPriority("Medium");
    } catch (error) {
      toast.error("Failed to generate care guidance");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkReviewed = async (id: string) => {
    const { error } = await supabase.from("care_guidance").update({ status: "Suspended" }).eq("id", id);
    if (!error) {
      toast.success("Marked as reviewed");
      queryClient.invalidateQueries({ queryKey: ["care_guidance"] });
    }
  };

  const handleDisable = async (id: string) => {
    const { error } = await supabase.from("care_guidance").update({ status: "Expired" }).eq("id", id);
    if (!error) {
      toast.success("Guidance disabled");
      queryClient.invalidateQueries({ queryKey: ["care_guidance"] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("care_guidance").delete().eq("id", id);
    if (!error) {
      toast.success("Guidance deleted");
      queryClient.invalidateQueries({ queryKey: ["care_guidance"] });
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "muted";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  if (patientsLoading || guidanceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Personalized Care Guidance"
        subtitle="AI-generated, patient-specific health action plans"
        icon={<Sparkles className="h-6 w-6" />}
        gradient="from-violet-500 to-purple-500"
      />

      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-glossy flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Generate New Guidance
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm muted-foreground">Active Plans</p>
              <p className="text-2xl font-bold">{activePlans}</p>
            </div>
            <CheckCircle className="h-8 w-8 success" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">{highPriority}</p>
            </div>
            <AlertTriangle className="h-8 w-8 destructive" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm muted-foreground">New This Week</p>
              <p className="text-2xl font-bold">{newThisWeek}</p>
            </div>
            <Target className="h-8 w-8 primary" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm muted-foreground">Avg Confidence</p>
              <p className="text-2xl font-bold">{avgConfidence}%</p>
            </div>
            <Sparkles className="h-8 w-8 gradient-text" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guidance.map((item) => {
          const patient = patients.find(p => p.id === item.patient_id);
          const isExpanded = expandedCards.has(item.id);
          const displayText = isExpanded 
            ? item.ai_generated_guidance 
            : item.ai_generated_guidance.substring(0, 200) + (item.ai_generated_guidance.length > 200 ? "..." : "");

          return (
            <div key={item.id} className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-bg flex items-center justify-center text-white font-semibold">
                  {patient?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-medium">{patient?.name || "Unknown Patient"}</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                    {item.condition_tag}
                  </span>
                </div>
              </div>

              <p className="text-sm muted-foreground">{displayText}</p>
              {item.ai_generated_guidance.length > 200 && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="text-xs primary hover:underline"
                >
                  {isExpanded ? "Show less" : "...more"}
                </button>
              )}

              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getConfidenceColor(item.confidence_score)}`}>
                  {item.confidence_score}% confidence
                </span>
                <StatusPill status={item.priority.toLowerCase()} />
              </div>

              <StatusPill status={item.status.toLowerCase()} />

              {item.expires_at && (
                <p className="text-xs muted-foreground">
                  Expires: {fmtDate(item.expires_at)}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {item.status === "Active" && (
                  <button
                    onClick={() => handleMarkReviewed(item.id)}
                    className="btn-glossy text-xs px-3 py-1"
                  >
                    Mark Reviewed
                  </button>
                )}
                {item.status === "Active" && (
                  <button
                    onClick={() => handleDisable(item.id)}
                    className="btn-glossy text-xs px-3 py-1 bg-warning"
                  >
                    Disable
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn-glossy text-xs px-3 py-1 bg-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Care Guidance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition Tag</label>
                <input
                  type="text"
                  value={conditionTag}
                  onChange={(e) => setConditionTag(e.target.value)}
                  placeholder="e.g., Diabetes, Hypertension"
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-glossy bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 btn-glossy"
                >
                  {isGenerating ? <Spinner className="h-4 w-4 animate-spin mx-auto" /> : "Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}