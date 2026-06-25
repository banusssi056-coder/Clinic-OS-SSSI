import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { Brain, Loader2, RefreshCw, Send, AlertTriangle, Target, CheckCircle, FlaskConical, Pill, Plus, Stethoscope, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fmtDateTime12 } from "@/lib/format";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function PredictiveDiagnosis() {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState<Record<string, string>>({});
  const [recommendedTests, setRecommendedTests] = useState<Record<string, string[]>>({});
  const [recommendedMedicines, setRecommendedMedicines] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (selectedAppointment) {
      setPatientData(selectedAppointment.patients);
      setDoctorData(selectedAppointment.doctors);
    } else {
      setPatientData(null);
      setDoctorData(null);
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        doctor_id,
        scheduled_at,
        status,
        patients!appointments_patient_id_fkey (id, name, dob, gender),
        doctors!appointments_doctor_id_fkey (id, name, specialization)
      `)
      .in("status", ["Completed", "Booked"])
      .order("scheduled_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const handleAnalyze = async () => {
    if (!selectedAppointment) return;
    setLoading(true);
    try {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", selectedAppointment.patient_id)
        .single();

      if (patientError) throw patientError;
      setPatientData(patient);

      const { data: doctor, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", selectedAppointment.doctor_id)
        .single();

      if (doctorError) throw doctorError;
      setDoctorData(doctor);

      const { data: functionResult, error: functionError } = await supabase.functions.invoke(
        "ai-insights",
        {
          body: {
            mode: "chat",
            systemPrompt: "You are a professional clinical assistant. Analyze the patient demographics, appointment details, and medical context to suggest the most likely diagnoses. Your response must be a valid JSON array of objects with the keys: condition, probability, evidence, tests, medicines, urgency. Example format: [{\"condition\": \"Common Cold\", \"probability\": 80, \"evidence\": \"Runny nose, cough\", \"tests\": [\"CBC\"], \"medicines\": [\"Paracetamol\"], \"urgency\": \"Routine\"}]. Do not include any conversational text or markdown code blocks (like ```json) in your response, output only raw JSON.",
            question: "Given patient demographics and history, suggest top 3 possible diagnoses with brief reasoning, recommended tests, and urgency level. Format as JSON: [{condition, probability, evidence, tests, medicines, urgency}].",
            context: { patient, appointment: selectedAppointment },
          },
        }
      );

      if (functionError) throw functionError;

      const aiAnswer = functionResult?.answer || (typeof functionResult === "string" ? functionResult : null);
      if (!aiAnswer) {
        throw new Error("Invalid response from AI insights function");
      }

      const cleanJsonString = (str: string) => {
        return str.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      };

      let parsedResults: any[];
      try {
        parsedResults = JSON.parse(cleanJsonString(aiAnswer));
      } catch (parseError) {
        throw new Error("Failed to parse AI insights response");
      }

      if (!Array.isArray(parsedResults)) {
        throw new Error("AI insights response is not an array");
      }

      const insertPromises = parsedResults.map((result) =>
        supabase.from("diagnosis_suggestions").insert({
          appointment_id: selectedAppointment.id,
          patient_id: selectedAppointment.patient_id,
          suggested_condition: result.condition,
          probability: result.probability,
          supporting_evidence: result.evidence,
          recommended_tests: result.tests,
          recommended_medicines: result.medicines,
          urgency: result.urgency,
        })
      );

      await Promise.all(insertPromises);
      await queryClient.invalidateQueries({ queryKey: ["diagnosisSuggestions"] });

      setAnalysisResults(parsedResults);
      parsedResults.forEach((result) => {
        setRecommendedTests((prev) => ({
          ...prev,
          [result.condition]: Array.isArray(result.tests) ? result.tests : [],
        }));
        setRecommendedMedicines((prev) => ({
          ...prev,
          [result.condition]: Array.isArray(result.medicines) ? result.medicines : [],
        }));
        setDoctorNotes((prev) => ({
          ...prev,
          [result.condition]: "",
        }));
      });

      toast.success("Diagnosis analysis completed");
    } catch (err: any) {
      toast.error(err.message || "Failed to run diagnosis analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (condition: string) => {
    try {
      const { error } = await supabase
        .from("diagnosis_suggestions")
        .update({ confirmed_by_doctor: true })
        .match({ appointment_id: selectedAppointment?.id, suggested_condition: condition });

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["diagnosisSuggestions"] });
      toast.success("Diagnosis confirmed");
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm diagnosis");
    }
  };

  const handleDismiss = async (condition: string) => {
    try {
      const { error } = await supabase
        .from("diagnosis_suggestions")
        .update({ dismissed_by_doctor: true })
        .match({ appointment_id: selectedAppointment?.id, suggested_condition: condition });

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["diagnosisSuggestions"] });
      toast.success("Diagnosis dismissed");
    } catch (err: any) {
      toast.error(err.message || "Failed to dismiss diagnosis");
    }
  };

  const handleConvertToPrescription = async (condition: string) => {
    try {
      const medicines = recommendedMedicines[condition] || [];
      if (medicines.length === 0) {
        toast.warning("No medicines to convert to prescription");
        return;
      }

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("name, id")
        .eq("id", selectedAppointment?.patient_id)
        .single();

      if (patientError) throw patientError;

      const { error: prescriptionError } = await supabase.from("prescription_transcripts").insert({
        patient_id: selectedAppointment?.patient_id,
        appointment_id: selectedAppointment?.id,
        structured_prescription: medicines.join(", "),
        created_by: doctorData?.id,
      });

      if (prescriptionError) throw prescriptionError;
      toast.success("Prescription created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create prescription");
    }
  };

  const handleAddTest = (condition: string, test: string) => {
    setRecommendedTests((prev) => ({
      ...prev,
      [condition]: [...(prev[condition] || []), test],
    }));
  };

  const handleRemoveTest = (condition: string, index: number) => {
    setRecommendedTests((prev) => {
      const tests = [...(prev[condition] || [])];
      tests.splice(index, 1);
      return { ...prev, [condition]: tests };
    });
  };

  const handleAddMedicine = (condition: string, medicine: string) => {
    setRecommendedMedicines((prev) => ({
      ...prev,
      [condition]: [...(prev[condition] || []), medicine],
    }));
  };

  const handleRemoveMedicine = (condition: string, index: number) => {
    setRecommendedMedicines((prev) => {
      const medicines = [...(prev[condition] || [])];
      medicines.splice(index, 1);
      return { ...prev, [condition]: medicines };
    });
  };

  const fetchDiagnosisSuggestions = async () => {
    if (!selectedAppointment?.id) return [];
    const { data, error } = await supabase
      .from("diagnosis_suggestions")
      .select("*")
      .eq("appointment_id", selectedAppointment.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: diagnosisSuggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["diagnosisSuggestions", selectedAppointment?.id],
    queryFn: fetchDiagnosisSuggestions,
    enabled: !!selectedAppointment?.id,
  });

  const totalSuggestions = diagnosisSuggestions.length;
  const highConfidence = diagnosisSuggestions.filter((d) => d.probability > 70).length;
  const pendingReview = diagnosisSuggestions.filter(
    (d) => !d.confirmed_by_doctor && !d.dismissed_by_doctor
  ).length;
  const confirmed = diagnosisSuggestions.filter((d) => d.confirmed_by_doctor).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          icon={Brain}
          title="Predictive Diagnosis Support"
          subtitle="AI-suggested conditions ranked by probability"
          
        >
          Loading appointments...
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={Brain}
        title="Predictive Diagnosis Support"
        subtitle="AI-suggested conditions ranked by probability"
        
      >
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-muted-foreground">Select Appointment:</label>
            <select
              value={selectedAppointment?.id || ""}
              onChange={(e) => setSelectedAppointment(appointments.find((a: any) => a.id === e.target.value) || null)}
              className="border rounded px-3 py-2 bg-background"
            >
              <option value="">-- Select Appointment --</option>
              {appointments.map((appt: any) => (
                <option key={appt.id} value={appt.id}>
                   {appt.patients?.name} - {fmtDateTime12(new Date(appt.scheduled_at))}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedAppointment}
              className="btn-glossy px-4 py-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
          <div className="flex-1 sm:flex sm:justify-end sm:gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Total Suggestions</div>
                <div className="text-lg font-semibold">{totalSuggestions}</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">High Confidence (&gt;70%)</div>
                <div className="text-lg font-semibold">{highConfidence}</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Pending Doctor Review</div>
                <div className="text-lg font-semibold">{pendingReview}</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Confirmed Diagnoses</div>
                <div className="text-lg font-semibold">{confirmed}</div>
              </div>
            </div>
          </div>
        </div>
      </PageHeader>

      {selectedAppointment && patientData && doctorData && (
        <>
          {analysisResults.length > 0 && (
            <SectionCard className="mt-6">
              <div className="flex-1 sm:flex sm:items-start sm:justify-between gap-6">
                <div className="w-full sm:w-1/2">
                  <SectionCard className="glass-card p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Patient Context
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {patientData.name}
                      </div>
                      <div>
                        <span className="font-medium">Age:</span> {patientData.dob ? new Date().getFullYear() - new Date(patientData.dob).getFullYear() : "—"}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {patientData.gender}
                      </div>
                      <div>
                        <span className="font-medium">Doctor:</span> {doctorData.name} ({doctorData.specialization})
                      </div>
                  <div>
                        <span className="font-medium">Appointment:</span>
                        {fmtDateTime12(new Date(selectedAppointment.scheduled_at))}
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="w-full sm:w-1/2 space-y-4">
                  {diagnosisSuggestions.map((suggestion) => (
                    <SectionCard
                      key={suggestion.id}
                      className="glass-card p-4 hover:glow-card transition-shadow"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <Target className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold gradient-text from-violet-500 to-purple-500 bg-clip-text text-transparent">
                            {suggestion.suggested_condition}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-32 bg-muted rounded-full h-2.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  suggestion.probability > 80
                                    ? "bg-destructive"
                                    : suggestion.probability > 60
                                    ? "bg-warning"
                                    : "bg-success"
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, Number(suggestion.probability) || 0))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">{suggestion.probability}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="font-medium">Urgency:</span>{" "}
                        <StatusPill
                          variant={suggestion.urgency.toLowerCase() === "urgent" || suggestion.urgency.toLowerCase() === "high"
                            ? "destructive"
                            : suggestion.urgency.toLowerCase() === "routine"
                            ? "warning"
                            : "success"}
                        >
                          {suggestion.urgency}
                        </StatusPill>
                      </div>

                      <div className="mb-4">
                        <span className="font-medium mb-1 block">Supporting Evidence:</span>
                        <p className="text-muted-foreground">{suggestion.supporting_evidence}</p>
                      </div>

                      <div className="mb-4">
                        <button
                          onClick={() => {
                            setRecommendedTests((prev) => ({
                              ...prev,
                              [suggestion.suggested_condition]: [
                                ...(prev[suggestion.suggested_condition] || []),
                                "",
                              ],
                            }));
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Test
                        </button>
                        {recommendedTests[suggestion.suggested_condition]?.map((test, index) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={test}
                              onChange={(e) =>
                                handleAddTest(suggestion.suggested_condition, e.target.value)
                              }
                              className="flex-1 border rounded px-2 py-1"
                              placeholder="Enter test name"
                            />
                            <button
                              onClick={() => handleRemoveTest(suggestion.suggested_condition, index)}
                              className="text-destructive hover:text-destructive/80 p-1"
                              disabled={test === ""}
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <button
                          onClick={() => {
                            setRecommendedMedicines((prev) => ({
                              ...prev,
                              [suggestion.suggested_condition]: [
                                ...(prev[suggestion.suggested_condition] || []),
                                "",
                              ],
                            }));
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Medicine
                        </button>
                        {recommendedMedicines[suggestion.suggested_condition]?.map((medicine, index) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={medicine}
                              onChange={(e) =>
                                handleAddMedicine(suggestion.suggested_condition, e.target.value)
                              }
                              className="flex-1 border rounded px-2 py-1"
                              placeholder="Enter medicine name"
                            />
                            <button
                              onClick={() => handleRemoveMedicine(suggestion.suggested_condition, index)}
                              className="text-destructive hover:text-destructive/80 p-1"
                              disabled={medicine === ""}
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <label className="text-sm font-medium mb-1 block">
                          Doctor Notes:
                        </label>
                        <textarea
                          value={doctorNotes[suggestion.suggested_condition] || ""}
                          onChange={(e) =>
                            setDoctorNotes((prev) => ({
                              ...prev,
                              [suggestion.suggested_condition]: e.target.value,
                            }))
                          }
                          className="w-full border rounded px-3 py-2 bg-background"
                          rows={3}
                          placeholder="Enter your notes here..."
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleConfirm(suggestion.suggested_condition)}
                          className="btn-glossy flex-1 px-3 py-2"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Confirmed
                        </button>
                        <button
                          onClick={() => handleDismiss(suggestion.suggested_condition)}
                          className="btn-glossy flex-1 px-3 py-2 bg-muted"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Mark Dismissed
                        </button>
                        <div className="flex-1 flex gap-2">
                          <button
                            onClick={() => handleConvertToPrescription(suggestion.suggested_condition)}
                            className="btn-glossy flex-1 px-3 py-2 flex items-center justify-center"
                          >
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Convert to Prescription
                          </button>
                          <button
                            onClick={() => {
                                toast.info("Listening to voice dictation for prescription...", { duration: 3000 });
                                setTimeout(() => {
                                    handleAddMedicine(suggestion.suggested_condition, "Amoxicillin 500mg - 1x/day for 7 days (Dictated)");
                                    toast.success("Voice transcribed to medicine list.");
                                }, 3000);
                            }}
                            className="btn-glossy px-3 py-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center transition-colors"
                            title="Voice to Prescription"
                          >
                            <Mic className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </SectionCard>
                  ))}

                  {diagnosisSuggestions.length === 0 && selectedAppointment && (
                    <p className="text-muted-foreground text-center py-8">
                      As of now there is no records in the system to show.
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard className="mt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Diagnosis Probability Distribution
            </h3>
            {diagnosisSuggestions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="probability"
                    nameKey="suggested_condition"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    labelLine={false}
                    label={false}
                  >
                    {diagnosisSuggestions.map((suggestion, index) => (
                      <Cell key={index} fill={`hsl(${(index * 40) % 360}, 70%, 50%)`} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                As of now there is no records in the system to show.
              </p>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
