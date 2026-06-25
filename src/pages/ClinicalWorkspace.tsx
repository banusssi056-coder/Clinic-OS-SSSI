import { useState, useEffect } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Stethoscope, Mic, FileText, Brain, Loader2, Play, Square, Save, Activity, FilePlus2, Languages, MessageCircleHeart } from "lucide-react";
import { toast } from "sonner";


const PATIENT_DATA: Record<string, { summary: string; translation: (lang: string) => string }> = {
  "John Doe (34, M)": {
    summary: "Patient has a history of Type 2 Diabetes and mild hypertension. Last HbA1c was 6.8% (3 months ago). Compliant with Metformin 500mg BID. No known allergies.",
    translation: (lang) => `In ${lang}: Hi John, your blood sugar levels are looking stable (HbA1c is 6.8%), and your blood pressure is slightly elevated but manageable. It's great that you are taking your Metformin twice a day as prescribed! Keep up the good work.`
  },
  "Sarah Smith (28, F)": {
    summary: "Patient has a history of Hypothyroidism and Vitamin D deficiency. Last TSH was 2.4 mIU/L (2 months ago). Compliant with Levothyroxine 50mcg daily. No known allergies.",
    translation: (lang) => `In ${lang}: Hi Sarah, your thyroid levels are looking stable (TSH is 2.4 mIU/L), but your Vitamin D levels are slightly low. It's great that you are taking your Levothyroxine every morning as prescribed! Remember to take your weekly Vitamin D supplement. Keep up the good work.`
  },
  "Raj Patel (45, M)": {
    summary: "Patient has a history of Hyperlipidemia and mild Asthmatic episodes. Last Lipid Profile showed LDL at 130 mg/dL (4 months ago). Compliant with Atorvastatin 10mg daily and Albuterol inhaler PRN. No known allergies.",
    translation: (lang) => `In ${lang}: Hi Raj, your cholesterol levels are well managed (LDL is 130 mg/dL), and your asthma has been stable. It's great that you are taking your Atorvastatin daily and keeping your inhaler handy for emergency use. Keep up the good work.`
  }
};

export default function ClinicalWorkspace() {
  const [selectedPatient, setSelectedPatient] = useState("John Doe (34, M)");
  const [language, setLanguage] = useState("English");
  const [isListening, setIsListening] = useState(false);
  
  // SOAP State
  const [soap, setSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);

  // Prescription State
  const [prescription, setPrescription] = useState("");
  const [isExtractingRx, setIsExtractingRx] = useState(false);

  // Diagnoses State
  const [diagnoses, setDiagnoses] = useState<{name:string, confidence:number, icd:string}[]>([]);

  // Clinical Summary
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    // Mocking an API call
    setTimeout(() => {
      const data = PATIENT_DATA[selectedPatient] || PATIENT_DATA["John Doe (34, M)"];
      setSummary(data.summary);
      setLoadingSummary(false);
      setTranslatedSummary("");
    }, 1500);
  };

  const translateForPatient = () => {
    if (!summary) return;
    setIsTranslating(true);
    setTimeout(() => {
      const data = PATIENT_DATA[selectedPatient] || PATIENT_DATA["John Doe (34, M)"];
      setTranslatedSummary(data.translation(language));
      setIsTranslating(false);
    }, 1200);
  };

  const toggleRecording = () => {
    if (isListening) {
      setIsListening(false);
      // Simulate processing the voice note
      setIsGeneratingSoap(true);
      setIsExtractingRx(true);
      toast("Processing voice note...");
      
      setTimeout(() => {
        setSoap({
          subjective: "Patient complains of frequent headaches and dizziness over the last 3 days.",
          objective: "BP is 145/90. Pulse 88. Temperature 98.6F. No focal neurological deficits.",
          assessment: "Essential hypertension, poorly controlled. Tension headache.",
          plan: "Increase Amlodipine to 10mg daily. Recommend lifestyle modifications. F/U in 2 weeks."
        });
        setIsGeneratingSoap(false);

        setPrescription("Amlodipine 10mg OD x 30 days\nParacetamol 500mg SOS for headache");
        setIsExtractingRx(false);

        setDiagnoses([
          { name: "Essential (primary) hypertension", confidence: 92, icd: "I10" },
          { name: "Tension-type headache", confidence: 85, icd: "G44.2" }
        ]);
        toast.success("SOAP note and prescriptions generated successfully.");
      }, 2500);

    } else {
      setIsListening(true);
      toast("Microphone active. Start speaking...");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical AI Workspace"
        subtitle="AI-Assisted Consultation, Documentation, and Diagnosis"
        icon={Stethoscope}
        gradient="from-blue-500 to-indigo-500"
        actions={
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted/50 border border-border">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer">
                <option>English</option>
                <option>Hindi</option>
                <option>Spanish</option>
                <option>Marathi</option>
              </select>
            </div>
            <select
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value);
                setSummary("");
                setTranslatedSummary("");
                setSoap({
                  subjective: "",
                  objective: "",
                  assessment: "",
                  plan: ""
                });
                setPrescription("");
                setDiagnoses([]);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>John Doe (34, M)</option>
              <option>Sarah Smith (28, F)</option>
              <option>Raj Patel (45, M)</option>
            </select>
          </div>
        }
      />

      {/* Top row: Summary & Voice/Rx */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Clinical Summarization */}
        <SectionCard title="AI Clinical Summarization" subtitle="1-Click Patient History Review" icon={Brain}>
          {!summary ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <p className="text-sm mb-3">Generate a concise summary from past visits and labs.</p>
              <button onClick={fetchSummary} disabled={loadingSummary} className="btn-glossy px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4" />}
                Generate Summary
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-48">
              <div className="flex-1 p-4 bg-muted/40 border border-border rounded-xl text-sm leading-relaxed relative group overflow-y-auto scrollbar-thin">
                <p className="font-medium text-foreground/90">{summary}</p>
                {translatedSummary && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary mb-2"><MessageCircleHeart className="w-4 h-4"/> Patient-Friendly ({language})</div>
                    <p className="text-foreground/80">{translatedSummary}</p>
                  </div>
                )}
                <button onClick={() => {setSummary(""); setTranslatedSummary("")}} className="absolute top-2 right-2 p-1.5 rounded-lg bg-card border border-border text-xs opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
              </div>
              <div className="mt-3 flex justify-end">
                <button onClick={translateForPatient} disabled={isTranslating} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition flex items-center gap-1.5">
                  {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />} Translate for Patient
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Voice to Prescription */}
        <SectionCard title="Voice-to-Prescription" subtitle={`Speak naturally in ${language} to generate Rx`} icon={Mic}>
          <div className="flex items-start gap-4">
            <button 
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'gradient-bg text-white hover:scale-105'}`}
            >
              {isListening ? <Square className="w-6 h-6" fill="currentColor"/> : <Mic className="w-7 h-7" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extracted Medications</div>
              <textarea 
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                placeholder={isListening ? "Listening..." : "Extracted prescriptions will appear here..."}
                className="w-full h-24 px-3 py-2 rounded-xl bg-muted/60 border border-border focus:bg-card focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                readOnly={isExtractingRx}
              />
              {isExtractingRx && <div className="text-xs text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Extracting medications...</div>}
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Bottom row: SOAP & Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Auto SOAP Notes */}
        <div className="lg:col-span-2">
          <SectionCard title="Automatic SOAP Notes" subtitle="AI categorizes your voice notes or shorthand" icon={FilePlus2}>
            {isGeneratingSoap ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Synthesizing clinical notes...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Subjective</label>
                    <textarea value={soap.subjective} onChange={e=>setSoap({...soap, subjective:e.target.value})} className="w-full h-24 p-3 rounded-xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary/20"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Objective</label>
                    <textarea value={soap.objective} onChange={e=>setSoap({...soap, objective:e.target.value})} className="w-full h-24 p-3 rounded-xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary/20"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Assessment</label>
                    <textarea value={soap.assessment} onChange={e=>setSoap({...soap, assessment:e.target.value})} className="w-full h-24 p-3 rounded-xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary/20"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Plan</label>
                    <textarea value={soap.plan} onChange={e=>setSoap({...soap, plan:e.target.value})} className="w-full h-24 p-3 rounded-xl bg-card border border-border text-sm resize-none focus:ring-2 focus:ring-primary/20"/>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn-glossy px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Encounter
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Predictive Diagnosis */}
        <div className="lg:col-span-1">
          <SectionCard title="Predictive Diagnosis" subtitle="Real-time AI suggestions" icon={Activity}>
            {diagnoses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center px-4 border-2 border-dashed border-border rounded-xl">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Start a voice consultation or enter notes to see real-time AI diagnosis suggestions based on ICD-10.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnoses.map((dx, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border bg-card flex flex-col gap-2 relative overflow-hidden group hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-sm leading-tight pr-4">{dx.name}</div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted whitespace-nowrap">{dx.icd}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>AI Confidence</span>
                        <span className="font-semibold text-primary">{dx.confidence}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full gradient-bg rounded-full" style={{ width: `${dx.confidence}%` }} />
                      </div>
                    </div>

                    <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-muted rounded hover:bg-primary/20 transition-all text-xs">
                      <FilePlus2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
