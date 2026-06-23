-- ============================================================
-- AI Clinical Features — No-Show Prediction, Disease Trends,
-- Queue Intelligence, Chronic Risk Monitoring, Wellness Tracking,
-- Medication Adherence, AI Health Coaching, Personalized Care
-- Guidance, AI Consultation Support, Voice-to-Prescription,
-- Automatic SOAP Notes, Predictive Diagnosis, Clinical Summ.
-- ============================================================

-- 1. NO-SHOW PREDICTIONS
CREATE TABLE public.no_show_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  no_show_score numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Low',
  factors jsonb DEFAULT '{}'::jsonb,
  ai_recommendation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. DISEASE TREND PREDICTIONS
CREATE TABLE public.disease_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_name text NOT NULL,
  predicted_increase numeric DEFAULT 0,
  confidence numeric DEFAULT 0,
  time_period text DEFAULT '30d',
  geographic_area text DEFAULT 'Mumbai',
  contributing_factors jsonb DEFAULT '[]'::jsonb,
  preventive_actions jsonb DEFAULT '[]'::jsonb,
  severity text DEFAULT 'Low',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. QUEUE INTELLIGENCE
CREATE TABLE public.queue_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  position_in_queue int DEFAULT 0,
  estimated_wait_min int DEFAULT 0,
  urgency_level text DEFAULT 'Normal',
  priority_flag text DEFAULT 'None',
  ai_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. CHRONIC RISK MONITORING
CREATE TABLE public.chronic_risk_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  condition_type text NOT NULL,
  current_risk_score int DEFAULT 0,
  risk_category text DEFAULT 'Low',
  monitoring_frequency text DEFAULT 'Monthly',
  key_metrics jsonb DEFAULT '{}'::jsonb,
  trend_direction text DEFAULT 'stable',
  ai_alerts jsonb DEFAULT '[]'::jsonb,
  last_assessment_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. WELLNESS TRACKING
CREATE TABLE public.wellness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  log_date date DEFAULT CURRENT_DATE,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,
  blood_sugar_fasting numeric,
  blood_sugar_postprandial numeric,
  weight numeric,
  height numeric,
  bmi numeric GENERATED ALWAYS AS (CASE WHEN weight IS NOT NULL AND height IS NOT NULL THEN ROUND(weight / POWER(height/100, 2)::numeric, 1) ELSE NULL END) STORED,
  heart_rate int,
  notes text,
  logged_by text DEFAULT 'Patient',
  created_at timestamptz DEFAULT now()
);

-- 6. MEDICATION ADHERENCE
CREATE TABLE public.medication_adherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  prescribed_by text,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  doses_taken int DEFAULT 0,
  doses_missed int DEFAULT 0,
  adherence_rate numeric DEFAULT 0,
  next_dose_at timestamptz,
  ai_reminder_settings jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. AI HEALTH COACHING
CREATE TABLE public.health_coaching_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  coaching_topic text,
  ai_model text DEFAULT 'gemini-2.5-flash',
  created_at timestamptz DEFAULT now()
);

-- 8. PERSONALIZED CARE GUIDANCE
CREATE TABLE public.care_guidance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  condition_tag text,
  ai_generated_guidance text NOT NULL,
  confidence_score numeric DEFAULT 0,
  priority text DEFAULT 'Medium',
  status text DEFAULT 'Active',
  reviewed_by text,
  expires_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. AI CONSULTATION SUPPORT
CREATE TABLE public.consultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  live_transcript text,
  ai_suggestions jsonb DEFAULT '[]'::jsonb,
  suspected_conditions jsonb DEFAULT '[]'::jsonb,
  recommended_tests jsonb DEFAULT '[]'::jsonb,
  recommended_medicines jsonb DEFAULT '[]'::jsonb,
  session_status text DEFAULT 'Active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 10. VOICE-TO-PRESCRIPTION
CREATE TABLE public.prescription_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  raw_audio_url text,
  transcript_text text,
  structured_prescription jsonb DEFAULT '{}'::jsonb,
  medicines jsonb DEFAULT '[]'::jsonb,
  ai_confidence numeric DEFAULT 0,
  status text DEFAULT 'Processing',
  reviewed_by_doctor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. AUTOMATIC SOAP NOTE GENERATION
CREATE TABLE public.auto_soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  subjective text,
  objective text,
  assessment text,
  plan jsonb DEFAULT '{}'::jsonb,
  ai_generated boolean DEFAULT true,
  reviewed_by_doctor boolean DEFAULT false,
  doctor_edits jsonb DEFAULT '{}'::jsonb,
  final_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 12. PREDICTIVE DIAGNOSIS SUPPORT
CREATE TABLE public.diagnosis_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  suggested_condition text NOT NULL,
  probability numeric DEFAULT 0,
  supporting_evidence text,
  recommended_tests jsonb DEFAULT '[]'::jsonb,
  recommended_medicines jsonb DEFAULT '[]'::jsonb,
  urgency text DEFAULT 'Routine',
  dismissed_by_doctor boolean DEFAULT false,
  confirmed_by_doctor boolean DEFAULT false,
  doctor_notes text,
  created_at timestamptz DEFAULT now()
);

-- 13. AI CLINICAL SUMMARIZATION
CREATE TABLE public.clinical_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  summary_type text DEFAULT 'Visit',
  ai_summary text NOT NULL,
  key_findings jsonb DEFAULT '[]'::jsonb,
  follow_up_recommendations jsonb DEFAULT '[]'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  generated_by text DEFAULT 'gemini-2.5-flash',
  reviewed_by_doctor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- indexes
CREATE INDEX idx_nosp_appt ON public.no_show_predictions(appointment_id);
CREATE INDEX idx_nosp_patient ON public.no_show_predictions(patient_id);
CREATE INDEX idx_diseases_condition ON public.disease_trends(condition_name);
CREATE INDEX idx_qi_appt ON public.queue_intelligence(appointment_id);
CREATE INDEX idx_cr_patient ON public.chronic_risk_plans(patient_id);
CREATE INDEX idx_well_patient ON public.wellness_logs(patient_id);
CREATE INDEX idx_well_date ON public.wellness_logs(log_date);
CREATE INDEX idx_med_patient ON public.medication_adherence(patient_id);
CREATE INDEX idx_hc_patient ON public.health_coaching_messages(patient_id);
CREATE INDEX idx_cg_patient ON public.care_guidance(patient_id);
CREATE INDEX idx_cons_appt ON public.consultation_sessions(appointment_id);
CREATE INDEX idx_presc_appt ON public.prescription_transcripts(appointment_id);
CREATE INDEX idx_soap_appt ON public.auto_soap_notes(appointment_id);
CREATE INDEX idx_diag_appt ON public.diagnosis_suggestions(appointment_id);
CREATE INDEX idx_clisum_patient ON public.clinical_summaries(patient_id);

-- RLS + permissive policies (demo)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'no_show_predictions','disease_trends','queue_intelligence','chronic_risk_plans',
    'wellness_logs','medication_adherence','health_coaching_messages','care_guidance',
    'consultation_sessions','prescription_transcripts','auto_soap_notes',
    'diagnosis_suggestions','clinical_summaries'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "demo_all_select" ON public.%I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_insert" ON public.%I FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_update" ON public.%I FOR UPDATE USING (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_delete" ON public.%I FOR DELETE USING (true);', t);
  END LOOP;
END $$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'no_show_predictions','disease_trends','queue_intelligence','chronic_risk_plans',
    'wellness_logs','medication_adherence','health_coaching_messages','care_guidance',
    'consultation_sessions','prescription_transcripts','auto_soap_notes',
    'diagnosis_suggestions','clinical_summaries'
  ])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;

-- seed sample disease trends
INSERT INTO public.disease_trends (condition_name, predicted_increase, confidence, time_period, geographic_area, contributing_factors, preventive_actions, severity)
VALUES
  ('Viral Fever', 18.5, 0.82, '30d', 'Mumbai', '["monsoon onset","air quality drop"]'::jsonb, '["hydration advice","immunity posters in waiting room"]'::jsonb, 'Medium'),
  ('Skin Allergy', 24.0, 0.76, '30d', 'Mumbai', '["pollution","seasonal pollen"]'::jsonb, '["indoor plant advice","antihistamine stock"]'::jsonb, 'Low'),
  ('Type-2 Diabetes Check', 12.3, 0.71, '90d', 'Mumbai', '["festival season diet","sedentary lifestyle"]'::jsonb, '["HbA1c campaign","diabetes awareness WhatsApp blast"]'::jsonb, 'High'),
  ('Pediatric Respiratory', 15.8, 0.88, '30d', 'Mumbai', '["school reopening","air pollution"]'::jsonb, '["vaccination reminder campaign","parent education SMS"]'::jsonb, 'Medium')
ON CONFLICT DO NOTHING;
