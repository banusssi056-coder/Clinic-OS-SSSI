-- ===========================================================
-- ClinicOS — Full Database Restore Script
-- Run against an empty Postgres/Supabase database in order.
-- ===========================================================

-- ===== schema/00_extensions.sql =====
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ===== schema/04_sequences.sql =====

-- ===== schema/01_tables.sql =====
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  scheduled_at timestamp with time zone NOT NULL,
  duration_min integer DEFAULT 30,
  status text DEFAULT 'Booked'::text,
  type text DEFAULT 'New'::text,
  token_no integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '[]'::jsonb,
  enabled boolean DEFAULT true,
  runs_count integer DEFAULT 0,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text DEFAULT 'WhatsApp'::text,
  audience_filter text,
  template text,
  status text DEFAULT 'Active'::text,
  sent_count integer DEFAULT 0,
  delivered integer DEFAULT 0,
  opened integer DEFAULT 0,
  booked integer DEFAULT 0,
  revenue_attributed numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  consultation_fee numeric NOT NULL DEFAULT 500,
  phone text,
  avatar_color text DEFAULT 'purple'::text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_no text,
  patient_id uuid,
  appointment_id uuid,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  paid numeric DEFAULT 0,
  payment_mode text DEFAULT 'UPI'::text,
  status text DEFAULT 'Paid'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  source text DEFAULT 'Google'::text,
  campaign_id uuid,
  status text DEFAULT 'New'::text,
  notes text,
  estimated_value numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  package_id uuid,
  sessions_used integer DEFAULT 0,
  started_at date DEFAULT CURRENT_DATE,
  expires_at date,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  channel text DEFAULT 'WhatsApp'::text,
  direction text DEFAULT 'out'::text,
  body text NOT NULL,
  status text DEFAULT 'Sent'::text,
  template_name text,
  sent_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  services text[] DEFAULT '{}'::text[],
  price numeric NOT NULL,
  validity_days integer DEFAULT 90,
  sessions_total integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  gender text,
  dob date,
  city text,
  source text DEFAULT 'Walk-in'::text,
  tags text[] DEFAULT '{}'::text[],
  lifetime_value numeric DEFAULT 0,
  last_visit date,
  status text DEFAULT 'Active'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  rating integer NOT NULL,
  text text,
  platform text DEFAULT 'Google'::text,
  requested_at timestamp with time zone DEFAULT now(),
  posted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_name text DEFAULT 'Kapoor Family Clinic'::text,
  tagline text DEFAULT 'Care that grows with you'::text,
  address text DEFAULT 'Bandra West, Mumbai 400050'::text,
  phone text DEFAULT '+91 98765 43210'::text,
  email text DEFAULT 'hello@kapoorclinic.in'::text,
  working_hours text DEFAULT 'Mon-Sat: 9:00 AM - 9:00 PM'::text,
  slot_duration integer DEFAULT 30,
  currency text DEFAULT 'INR'::text,
  timezone text DEFAULT 'Asia/Kolkata'::text,
  theme_gradient text DEFAULT 'purple-pink-orange'::text,
  whatsapp_template_followup text DEFAULT 'Hi {{name}}, hope you''re feeling better! Time for your follow-up at Kapoor Clinic. Reply YES to book.'::text,
  whatsapp_template_noshow text DEFAULT 'Hi {{name}}, we missed you today! Reschedule with 10% off — reply BOOK to confirm.'::text,
  whatsapp_template_review text DEFAULT 'Thank you for visiting, {{name}}! Please share your experience: {{link}}'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  email text,
  status text DEFAULT 'Active'::text,
  performance_score integer DEFAULT 80,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee_id uuid,
  related_patient_id uuid,
  due_at timestamp with time zone,
  priority text DEFAULT 'Medium'::text,
  status text DEFAULT 'Open'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== schema/02_constraints.sql =====
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);
ALTER TABLE public.automations ADD CONSTRAINT automations_pkey PRIMARY KEY (id);
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);
ALTER TABLE public.doctors ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no);
ALTER TABLE public.leads ADD CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);
ALTER TABLE public.memberships ADD CONSTRAINT memberships_package_id_fkey FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL;
ALTER TABLE public.memberships ADD CONSTRAINT memberships_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE public.memberships ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);
ALTER TABLE public.messages ADD CONSTRAINT messages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE public.packages ADD CONSTRAINT packages_pkey PRIMARY KEY (id);
ALTER TABLE public.patients ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
ALTER TABLE public.reviews ADD CONSTRAINT reviews_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.settings ADD CONSTRAINT settings_pkey PRIMARY KEY (id);
ALTER TABLE public.staff ADD CONSTRAINT staff_pkey PRIMARY KEY (id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_related_patient_id_fkey FOREIGN KEY (related_patient_id) REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

-- ===== schema/03_indexes.sql =====
CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);
CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);
CREATE INDEX idx_appts_scheduled ON public.appointments USING btree (scheduled_at);
CREATE INDEX idx_appts_status ON public.appointments USING btree (status);
CREATE UNIQUE INDEX automations_pkey ON public.automations USING btree (id);
CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id);
CREATE UNIQUE INDEX doctors_pkey ON public.doctors USING btree (id);
CREATE INDEX idx_invoices_created ON public.invoices USING btree (created_at);
CREATE UNIQUE INDEX invoices_invoice_no_key ON public.invoices USING btree (invoice_no);
CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);
CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);
CREATE UNIQUE INDEX memberships_pkey ON public.memberships USING btree (id);
CREATE INDEX idx_messages_patient ON public.messages USING btree (patient_id);
CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);
CREATE UNIQUE INDEX packages_pkey ON public.packages USING btree (id);
CREATE INDEX idx_patients_status ON public.patients USING btree (status);
CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id);
CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);
CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);
CREATE UNIQUE INDEX staff_pkey ON public.staff USING btree (id);
CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

-- ===== schema/05_views.sql =====

-- ===== schema/06_matviews.sql =====

-- ===== functions/functions.sql =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$
;


-- ===== triggers/triggers.sql =====
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_packages_updated BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_automations_updated BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== policies/policies.sql =====
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.activity_logs AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.activity_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.activity_logs AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.activity_logs AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.appointments AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.appointments AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.appointments AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.appointments AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.automations AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.automations AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.automations AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.automations AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.campaigns AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.campaigns AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.campaigns AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.campaigns AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.doctors AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.doctors AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.doctors AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.doctors AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.invoices AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.invoices AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.invoices AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.invoices AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.leads AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.leads AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.leads AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.leads AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.memberships AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.memberships AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.memberships AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.memberships AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.messages AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.messages AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.messages AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.messages AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.packages AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.packages AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.packages AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.packages AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.patients AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.patients AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.patients AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.patients AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.reviews AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.reviews AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.reviews AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.reviews AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.settings AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.settings AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.settings AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.settings AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.staff AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.staff AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.staff AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.staff AS PERMISSIVE FOR UPDATE TO public USING (true);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_delete ON public.tasks AS PERMISSIVE FOR DELETE TO public USING (true);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_insert ON public.tasks AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_select ON public.tasks AS PERMISSIVE FOR SELECT TO public USING (true);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_all_update ON public.tasks AS PERMISSIVE FOR UPDATE TO public USING (true);

-- ===== roles/grants.sql =====
GRANT INSERT ON public.activity_logs TO sandbox_exec;
GRANT SELECT ON public.activity_logs TO sandbox_exec;
GRANT SELECT ON public.appointments TO sandbox_exec;
GRANT INSERT ON public.appointments TO sandbox_exec;
GRANT INSERT ON public.automations TO sandbox_exec;
GRANT SELECT ON public.automations TO sandbox_exec;
GRANT SELECT ON public.campaigns TO sandbox_exec;
GRANT INSERT ON public.campaigns TO sandbox_exec;
GRANT INSERT ON public.doctors TO sandbox_exec;
GRANT SELECT ON public.doctors TO sandbox_exec;
GRANT INSERT ON public.invoices TO sandbox_exec;
GRANT SELECT ON public.invoices TO sandbox_exec;
GRANT SELECT ON public.leads TO sandbox_exec;
GRANT INSERT ON public.leads TO sandbox_exec;
GRANT INSERT ON public.memberships TO sandbox_exec;
GRANT SELECT ON public.memberships TO sandbox_exec;
GRANT SELECT ON public.messages TO sandbox_exec;
GRANT INSERT ON public.messages TO sandbox_exec;
GRANT INSERT ON public.packages TO sandbox_exec;
GRANT SELECT ON public.packages TO sandbox_exec;
GRANT INSERT ON public.patients TO sandbox_exec;
GRANT SELECT ON public.patients TO sandbox_exec;
GRANT INSERT ON public.reviews TO sandbox_exec;
GRANT SELECT ON public.reviews TO sandbox_exec;
GRANT SELECT ON public.settings TO sandbox_exec;
GRANT INSERT ON public.settings TO sandbox_exec;
GRANT INSERT ON public.staff TO sandbox_exec;
GRANT SELECT ON public.staff TO sandbox_exec;
GRANT INSERT ON public.tasks TO sandbox_exec;
GRANT SELECT ON public.tasks TO sandbox_exec;

-- ===== seed data =====
-- Seed data for ClinicOS — generated 2026-04-27T15:04:06Z
BEGIN;

-- Table: settings
INSERT INTO public."settings" SELECT * FROM json_populate_recordset(NULL::public."settings", '[{"id":"4c53a106-900d-431d-8a7c-26abb1609a0c","clinic_name":"Kapoor Family Clinic","tagline":"Care that grows with you","address":"Bandra West, Mumbai 400050","phone":"+91 98765 43210","email":"hello@kapoorclinic.in","working_hours":"Mon-Sat: 9:00 AM - 9:00 PM","slot_duration":30,"currency":"INR","timezone":"Asia/Kolkata","theme_gradient":"purple-pink-orange","whatsapp_template_followup":"Hi {{name}}, hope you''re feeling better! Time for your follow-up at Kapoor Clinic. Reply YES to book.","whatsapp_template_noshow":"Hi {{name}}, we missed you today! Reschedule with 10% off — reply BOOK to confirm.","whatsapp_template_review":"Thank you for visiting, {{name}}! Please share your experience: {{link}}","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: doctors
INSERT INTO public."doctors" SELECT * FROM json_populate_recordset(NULL::public."doctors", '[{"id":"2993de02-ed9b-4763-ad47-06721e12a43c","name":"Dr. Rajesh Kapoor","specialization":"General Physician","consultation_fee":600,"phone":"+91 98200 11111","avatar_color":"purple","active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","name":"Dr. Ananya Iyer","specialization":"Dermatologist","consultation_fee":1200,"phone":"+91 98200 22222","avatar_color":"pink","active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6de1a27a-24ef-4b8c-958d-d5c2607046ea","name":"Dr. Vikram Mehta","specialization":"Pediatrician","consultation_fee":800,"phone":"+91 98200 33333","avatar_color":"orange","active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: staff
INSERT INTO public."staff" SELECT * FROM json_populate_recordset(NULL::public."staff", '[{"id":"bd31b8db-d016-4737-b39e-cbe1a82b4062","name":"Pooja Nair","role":"Receptionist","phone":"+91 99000 11122","email":"pooja@kapoorclinic.in","status":"Active","performance_score":92,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"d962309d-720d-47f9-a566-6b01e6946a93","name":"Suresh Yadav","role":"Receptionist","phone":"+91 99000 22233","email":"suresh@kapoorclinic.in","status":"Active","performance_score":78,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"f4627975-6966-4b29-9499-d817d7d3c76b","name":"Meera Joshi","role":"Nurse","phone":"+91 99000 33344","email":"meera@kapoorclinic.in","status":"Active","performance_score":88,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"653e2137-e10a-4427-bdee-e194642311b8","name":"Kavita Reddy","role":"Nurse","phone":"+91 99000 44455","email":"kavita@kapoorclinic.in","status":"Active","performance_score":85,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a0d9d618-44dc-43f1-9a51-27142740875c","name":"Arjun Singh","role":"Admin","phone":"+91 99000 55566","email":"arjun@kapoorclinic.in","status":"Active","performance_score":95,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"9103472b-2e1f-4bff-8ddb-e3eaacf85320","name":"Neha Gupta","role":"Receptionist","phone":"+91 99000 66677","email":"neha@kapoorclinic.in","status":"On Leave","performance_score":72,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: packages
INSERT INTO public."packages" SELECT * FROM json_populate_recordset(NULL::public."packages", '[{"id":"1e19eb37-29f2-4cbc-8e51-042d6f0f385f","name":"Skin Glow Pack","description":"6-session facial care program","services":["Cleanup","Facial","Mask"],"price":12000,"validity_days":180,"sessions_total":6,"active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5cbed305-36f8-476b-9f46-da68c6f83ee1","name":"Diabetes Care Plus","description":"Quarterly check-ins and consults","services":["Consultation","Lab review"],"price":8500,"validity_days":90,"sessions_total":4,"active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"9fb9d856-8fa8-484c-9611-10083ce826c1","name":"Family Wellness","description":"Annual checkups for 4 family members","services":["Consultation","Vitals"],"price":15000,"validity_days":365,"sessions_total":8,"active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"73f4a79a-ad1c-435c-a729-78d5f0ba0d41","name":"Pediatric Bright Start","description":"Vaccination + growth tracking","services":["Consultation","Vitals"],"price":6500,"validity_days":365,"sessions_total":6,"active":true,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: patients
INSERT INTO public."patients" SELECT * FROM json_populate_recordset(NULL::public."patients", '[{"id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","name":"Aarav Sharma","phone":"+91 98765 10001","email":"aarav.sharma@gmail.com","gender":"Male","dob":"1988-04-12","city":"Mumbai","source":"Google","tags":["VIP","Regular"],"lifetime_value":18500,"last_visit":"2026-04-19","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","name":"Priya Patel","phone":"+91 98765 10002","email":"priya.p@yahoo.in","gender":"Female","dob":"1992-09-23","city":"Mumbai","source":"Referral","tags":["Skin"],"lifetime_value":9800,"last_visit":"2026-04-12","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","name":"Rohan Desai","phone":"+91 98765 10003","email":"rohan.d@gmail.com","gender":"Male","dob":"1985-11-05","city":"Pune","source":"WhatsApp","tags":["Diabetes"],"lifetime_value":24300,"last_visit":"2026-04-22","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6feef8e5-181d-4b57-baf2-ec60fc64ab68","name":"Ishita Reddy","phone":"+91 98765 10004","email":"ishita.r@outlook.com","gender":"Female","dob":"1995-02-18","city":"Bengaluru","source":"Instagram","tags":["New"],"lifetime_value":1200,"last_visit":"2026-04-23","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8044183d-3d93-41e0-a433-067af0e99eed","name":"Karan Malhotra","phone":"+91 98765 10005","email":"karan.m@gmail.com","gender":"Male","dob":"1979-06-30","city":"Delhi","source":"Walk-in","tags":["Regular"],"lifetime_value":32100,"last_visit":"2026-04-04","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","name":"Anjali Nair","phone":"+91 98765 10006","email":"anjali.n@gmail.com","gender":"Female","dob":"1990-12-09","city":"Mumbai","source":"Google","tags":["Skin","VIP"],"lifetime_value":27800,"last_visit":"2026-04-16","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8f53dcae-d151-4fe4-b0a0-9232c6559ef5","name":"Vivaan Joshi","phone":"+91 98765 10007","email":"vivaan.j@gmail.com","gender":"Male","dob":"2015-03-21","city":"Mumbai","source":"Referral","tags":["Pediatric"],"lifetime_value":6400,"last_visit":"2026-04-09","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","name":"Sneha Iyer","phone":"+91 98765 10008","email":"sneha.i@gmail.com","gender":"Female","dob":"1983-08-14","city":"Bengaluru","source":"Google","tags":["Regular"],"lifetime_value":15600,"last_visit":"2026-03-20","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"c3e43063-733f-42dc-a719-188132c53ef9","name":"Yash Agarwal","phone":"+91 98765 10009","email":"yash.a@gmail.com","gender":"Male","dob":"1998-05-02","city":"Pune","source":"WhatsApp","tags":["New"],"lifetime_value":800,"last_visit":"2026-04-21","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6c4b5b4e-8011-4061-8edd-74b2e23ab3b7","name":"Diya Kapoor","phone":"+91 98765 10010","email":"diya.k@gmail.com","gender":"Female","dob":"2010-10-17","city":"Delhi","source":"Referral","tags":["Pediatric"],"lifetime_value":4200,"last_visit":"2026-04-17","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","name":"Aditya Verma","phone":"+91 98765 10011","email":"aditya.v@gmail.com","gender":"Male","dob":"1975-01-25","city":"Mumbai","source":"Walk-in","tags":["Senior"],"lifetime_value":41200,"last_visit":"2026-01-19","status":"At Risk","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"e44de894-ddd3-452d-94d8-30085a15dd51","name":"Riya Bhat","phone":"+91 98765 10012","email":"riya.b@gmail.com","gender":"Female","dob":"1989-07-11","city":"Bengaluru","source":"Instagram","tags":["Skin"],"lifetime_value":12800,"last_visit":"2026-01-04","status":"At Risk","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"41af0d1c-40d7-4c41-9d11-0d26c0de97b0","name":"Manav Singh","phone":"+91 98765 10013","email":"manav.s@gmail.com","gender":"Male","dob":"1993-04-29","city":"Delhi","source":"Google","tags":["Regular"],"lifetime_value":8900,"last_visit":"2026-04-20","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"939d5daa-ce57-44b3-83ef-4009f8aee415","name":"Sara Khan","phone":"+91 98765 10014","email":"sara.k@gmail.com","gender":"Female","dob":"1996-11-08","city":"Mumbai","source":"WhatsApp","tags":["New"],"lifetime_value":1500,"last_visit":"2026-04-18","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"2c96548e-2cd9-4a53-8098-1989ba2d8491","name":"Rahul Pandey","phone":"+91 98765 10015","email":"rahul.p@gmail.com","gender":"Male","dob":"1982-09-15","city":"Pune","source":"Referral","tags":["Diabetes","Regular"],"lifetime_value":22400,"last_visit":"2026-04-06","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"70803522-d19a-4b75-b33e-936dc98ce55e","name":"Tanya Bose","phone":"+91 98765 10016","email":"tanya.b@gmail.com","gender":"Female","dob":"1991-06-20","city":"Bengaluru","source":"Google","tags":["Skin","VIP"],"lifetime_value":19700,"last_visit":"2026-04-14","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"bbcc8d89-62b2-47f3-a21b-217b672a81e9","name":"Kabir Khanna","phone":"+91 98765 10017","email":"kabir.k@gmail.com","gender":"Male","dob":"2012-12-03","city":"Mumbai","source":"Walk-in","tags":["Pediatric"],"lifetime_value":3800,"last_visit":"2026-04-02","status":"Active","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8f3b6bd0-f922-4476-bf11-9964a09c9176","name":"Pooja Mehta","phone":"+91 98765 10018","email":"pooja.m@gmail.com","gender":"Female","dob":"1987-02-27","city":"Delhi","source":"Instagram","tags":["Regular"],"lifetime_value":14300,"last_visit":"2025-12-15","status":"At Risk","notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: leads
INSERT INTO public."leads" SELECT * FROM json_populate_recordset(NULL::public."leads", '[{"id":"532026c5-d665-45c0-8c5f-4b79cca82b93","name":"Nikhil Rao","phone":"+91 98700 20001","source":"Google","campaign_id":null,"status":"New","notes":null,"estimated_value":1500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"1958bd0f-569b-44ae-8096-d54a542528e5","name":"Shreya Kulkarni","phone":"+91 98700 20002","source":"Instagram","campaign_id":"0865d010-8f9d-4e38-863f-3e0d5b55237a","status":"Contacted","notes":null,"estimated_value":12000,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"86b6ab89-b7a9-47be-9222-b6c1ff664096","name":"Aman Tripathi","phone":"+91 98700 20003","source":"Referral","campaign_id":null,"status":"Booked","notes":null,"estimated_value":2500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"500b8f4f-b505-4e6c-89f6-6afeabdd581e","name":"Lakshmi Menon","phone":"+91 98700 20004","source":"WhatsApp","campaign_id":null,"status":"New","notes":null,"estimated_value":800,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b3cf61c9-9dbf-4c3b-ae23-c0e0c061ad94","name":"Dev Patel","phone":"+91 98700 20005","source":"Google","campaign_id":null,"status":"Contacted","notes":null,"estimated_value":1200,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6c6d6ba9-f68b-4d19-82df-9ec451d05cac","name":"Ria Saxena","phone":"+91 98700 20006","source":"Instagram","campaign_id":"0865d010-8f9d-4e38-863f-3e0d5b55237a","status":"Booked","notes":null,"estimated_value":3200,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3aad6561-e240-4487-8f89-5704c5e5752e","name":"Aryan Bhatia","phone":"+91 98700 20007","source":"Google","campaign_id":null,"status":"Lost","notes":null,"estimated_value":0,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"2dbf230e-81fc-469e-8a85-03900c7a2d9c","name":"Mira Chowdhury","phone":"+91 98700 20008","source":"Referral","campaign_id":null,"status":"New","notes":null,"estimated_value":5000,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"d965292c-04a0-417d-b0dc-c8515e3a3b0d","name":"Vikrant Sahni","phone":"+91 98700 20009","source":"WhatsApp","campaign_id":"acc77aae-4c9b-438e-9673-8cdfb2de1795","status":"Contacted","notes":null,"estimated_value":8500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5656ab1d-62dd-414b-ab44-7ae9fcddb974","name":"Naina Bhardwaj","phone":"+91 98700 20010","source":"Google","campaign_id":null,"status":"Booked","notes":null,"estimated_value":1500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b47e2401-aa8b-484e-9300-83d83a8017b2","name":"Tarun Chopra","phone":"+91 98700 20011","source":"Instagram","campaign_id":null,"status":"New","notes":null,"estimated_value":2200,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3768b299-319b-4e67-ace8-645ce05aa1e1","name":"Esha Jain","phone":"+91 98700 20012","source":"Referral","campaign_id":"50a92ce3-3b64-4186-afb3-1bc8e7555ef1","status":"Contacted","notes":null,"estimated_value":6500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"fef523e4-2a02-4c50-9cbf-ab86b6f1def6","name":"Harsh Vora","phone":"+91 98700 20013","source":"Google","campaign_id":null,"status":"New","notes":null,"estimated_value":900,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"d5310d76-b5e7-4096-bb80-8a9d139ae7a2","name":"Kriti Mishra","phone":"+91 98700 20014","source":"WhatsApp","campaign_id":"0865d010-8f9d-4e38-863f-3e0d5b55237a","status":"Booked","notes":null,"estimated_value":12000,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: campaigns
INSERT INTO public."campaigns" SELECT * FROM json_populate_recordset(NULL::public."campaigns", '[{"id":"0865d010-8f9d-4e38-863f-3e0d5b55237a","name":"Diwali Skin Glow Offer","channel":"WhatsApp","audience_filter":"tag:Skin","template":"✨ Diwali special! 20% off on Skin Glow Pack at Kapoor Clinic. Book now!","status":"Active","sent_count":320,"delivered":312,"opened":198,"booked":28,"revenue_attributed":168000,"cost":1500,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"d7c70811-1d57-4319-8e9d-0cf26c37dbdb","name":"No-Show Recovery","channel":"WhatsApp","audience_filter":"status:NoShow","template":"We missed you! Reschedule with 10% off — reply BOOK","status":"Active","sent_count":45,"delivered":44,"opened":32,"booked":18,"revenue_attributed":21600,"cost":200,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b6b51e8f-9835-4b30-bba7-05a05ed326c5","name":"Win-back: 90+ days","channel":"WhatsApp","audience_filter":"last_visit>90d","template":"Hi {{name}}, it''s been a while. Free consultation this week!","status":"Active","sent_count":86,"delivered":84,"opened":51,"booked":12,"revenue_attributed":14400,"cost":400,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"acc77aae-4c9b-438e-9673-8cdfb2de1795","name":"Diabetes Care Awareness","channel":"SMS","audience_filter":"tag:Diabetes","template":"Free HbA1c check with consultation — book today at Kapoor Clinic","status":"Active","sent_count":140,"delivered":138,"opened":67,"booked":9,"revenue_attributed":13500,"cost":700,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"50a92ce3-3b64-4186-afb3-1bc8e7555ef1","name":"Pediatric Vaccination Drive","channel":"WhatsApp","audience_filter":"tag:Pediatric","template":"Vaccination camp this Saturday — limited slots, book now!","status":"Active","sent_count":62,"delivered":61,"opened":48,"booked":22,"revenue_attributed":26400,"cost":300,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: appointments
INSERT INTO public."appointments" SELECT * FROM json_populate_recordset(NULL::public."appointments", '[{"id":"a9c0c325-5238-4407-8bcd-930d33b813b2","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-24T10:00:00+00:00","duration_min":30,"status":"CheckedIn","type":"Followup","token_no":1,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3ebff09f-e0e3-4334-a716-1a7922804330","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-24T10:30:00+00:00","duration_min":30,"status":"Booked","type":"New","token_no":2,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"7b2ca31a-b474-415c-8a5f-7fcfbc512da6","patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-24T11:00:00+00:00","duration_min":30,"status":"Booked","type":"Followup","token_no":3,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"bfd4fec4-e9df-4604-893a-97fe75cbcdd3","patient_id":"6feef8e5-181d-4b57-baf2-ec60fc64ab68","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-24T11:30:00+00:00","duration_min":30,"status":"Booked","type":"New","token_no":4,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8a4dc59c-7153-48a9-a6d7-9174f300e148","patient_id":"8f53dcae-d151-4fe4-b0a0-9232c6559ef5","doctor_id":"6de1a27a-24ef-4b8c-958d-d5c2607046ea","scheduled_at":"2026-04-24T14:00:00+00:00","duration_min":30,"status":"Booked","type":"Followup","token_no":5,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"df7ecf51-93ea-4000-a232-648cc4d161e8","patient_id":"939d5daa-ce57-44b3-83ef-4009f8aee415","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-24T15:00:00+00:00","duration_min":30,"status":"Booked","type":"New","token_no":6,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"70e27e0b-87e2-42cb-80b3-f44ec1481fce","patient_id":"6c4b5b4e-8011-4061-8edd-74b2e23ab3b7","doctor_id":"6de1a27a-24ef-4b8c-958d-d5c2607046ea","scheduled_at":"2026-04-24T16:00:00+00:00","duration_min":30,"status":"Booked","type":"Followup","token_no":7,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"33e99aca-afcb-427e-9af1-0467ad1619bc","patient_id":"70803522-d19a-4b75-b33e-936dc98ce55e","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-24T17:00:00+00:00","duration_min":30,"status":"Booked","type":"New","token_no":8,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"af9fd88d-7f1a-4266-b639-20802f5d93b9","patient_id":"8044183d-3d93-41e0-a433-067af0e99eed","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-22T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"43cf4b29-30fd-424f-89ee-7b8258ae4f20","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-19T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"ba7d25a6-1875-4541-a272-32aa8bca9ee8","patient_id":"2c96548e-2cd9-4a53-8098-1989ba2d8491","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-17T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"efbd6aa2-5f67-4aa2-90e3-a6447452acbd","patient_id":"41af0d1c-40d7-4c41-9d11-0d26c0de97b0","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-20T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"c9abfb0d-23b7-44f1-a0b4-fd0a41bb762c","patient_id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-14T16:54:24.316468+00:00","duration_min":30,"status":"NoShow","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"fb151b41-f405-4596-80be-617abe74ac9c","patient_id":"c3e43063-733f-42dc-a719-188132c53ef9","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-21T16:54:24.316468+00:00","duration_min":30,"status":"NoShow","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"98c61ee9-2e95-4f42-8887-bad2ea4f4d6f","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-27T03:54:24.316468+00:00","duration_min":30,"status":"Booked","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"44b546d7-ac04-4a92-9efb-34b53b52b2a0","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-04-28T06:54:24.316468+00:00","duration_min":30,"status":"Booked","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"af4b0093-c278-4d29-ba33-f1f53bb1a494","patient_id":"bbcc8d89-62b2-47f3-a21b-217b672a81e9","doctor_id":"6de1a27a-24ef-4b8c-958d-d5c2607046ea","scheduled_at":"2026-04-26T02:54:24.316468+00:00","duration_min":30,"status":"Booked","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"83014d09-64c4-402c-b45b-1dce836f60b3","patient_id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-01-19T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a8920885-4b7d-4f3d-ac41-98547ada60ae","patient_id":"e44de894-ddd3-452d-94d8-30085a15dd51","doctor_id":"7486b1b0-f703-4bb0-af19-ce1a2d93856a","scheduled_at":"2026-01-04T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"ca5d30ef-24a2-4882-97a9-ceb93cc297a2","patient_id":"8f3b6bd0-f922-4476-bf11-9964a09c9176","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2025-12-15T16:54:24.316468+00:00","duration_min":30,"status":"Completed","type":"Followup","token_no":null,"notes":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a2814add-9c8a-4c89-81d0-11601a911a8a","patient_id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-27T05:00:00+00:00","duration_min":30,"status":"Booked","type":"New","token_no":null,"notes":null,"created_at":"2026-04-24T18:50:21.040101+00:00","updated_at":"2026-04-24T18:50:21.040101+00:00"}, {"id":"ff1a883a-c5f4-428b-bc71-0a41e83a73f8","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","doctor_id":"2993de02-ed9b-4763-ad47-06721e12a43c","scheduled_at":"2026-04-25T00:30:00+00:00","duration_min":30,"status":"Booked","type":"Walkin","token_no":null,"notes":null,"created_at":"2026-04-24T18:51:11.208281+00:00","updated_at":"2026-04-24T18:51:11.208281+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: invoices
INSERT INTO public."invoices" SELECT * FROM json_populate_recordset(NULL::public."invoices", '[{"id":"0506ed72-cbec-43eb-b00b-9dc2ee044a7d","invoice_no":"INV-1001","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}],"subtotal":600,"discount":0,"tax":0,"total":600,"paid":600,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-19T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b6543610-1eb4-4899-98b0-bf9299ca7fd7","invoice_no":"INV-1002","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","appointment_id":null,"items":[{"qty": 1, "name": "Skin Cleanup", "price": 2500}],"subtotal":2500,"discount":250,"tax":0,"total":2250,"paid":2250,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-12T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"e5e1a0ab-c04c-45dd-b3f4-7c92c59491a5","invoice_no":"INV-1003","patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}, {"qty": 1, "name": "Lab review", "price": 400}],"subtotal":1000,"discount":0,"tax":0,"total":1000,"paid":1000,"payment_mode":"Card","status":"Paid","created_at":"2026-04-22T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"bb55deae-04a0-449f-90c8-fa374d0bce1a","invoice_no":"INV-1004","patient_id":"6feef8e5-181d-4b57-baf2-ec60fc64ab68","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 1200}],"subtotal":1200,"discount":0,"tax":0,"total":1200,"paid":1200,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-23T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"4f9800a9-a8f6-4fbc-abad-9e9db97715e6","invoice_no":"INV-1005","patient_id":"8044183d-3d93-41e0-a433-067af0e99eed","appointment_id":null,"items":[{"qty": 1, "name": "Family Wellness Pack", "price": 15000}],"subtotal":15000,"discount":1500,"tax":0,"total":13500,"paid":13500,"payment_mode":"Card","status":"Paid","created_at":"2026-04-04T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"9ccaf947-e590-4987-80fb-31fdbd7f951a","invoice_no":"INV-1006","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","appointment_id":null,"items":[{"qty": 1, "name": "Skin Glow Pack", "price": 12000}],"subtotal":12000,"discount":0,"tax":0,"total":12000,"paid":12000,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-16T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"0ae35b4a-08ce-4930-81ee-8ccea3a079e5","invoice_no":"INV-1007","patient_id":"8f53dcae-d151-4fe4-b0a0-9232c6559ef5","appointment_id":null,"items":[{"qty": 1, "name": "Pediatric Consult", "price": 800}],"subtotal":800,"discount":0,"tax":0,"total":800,"paid":800,"payment_mode":"Cash","status":"Paid","created_at":"2026-04-09T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"cd399729-9c4d-4f2b-9129-2f7136c41534","invoice_no":"INV-1008","patient_id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 1200}],"subtotal":1200,"discount":0,"tax":0,"total":1200,"paid":0,"payment_mode":"UPI","status":"Pending","created_at":"2026-03-20T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"698c7c1b-fea7-4e24-92c1-971680d30518","invoice_no":"INV-1009","patient_id":"c3e43063-733f-42dc-a719-188132c53ef9","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}],"subtotal":600,"discount":0,"tax":0,"total":600,"paid":600,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-21T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"42f06bca-f9d2-43f3-a7a3-a0b49fb00232","invoice_no":"INV-1010","patient_id":"6c4b5b4e-8011-4061-8edd-74b2e23ab3b7","appointment_id":null,"items":[{"qty": 1, "name": "Pediatric Consult", "price": 800}],"subtotal":800,"discount":0,"tax":0,"total":800,"paid":800,"payment_mode":"Cash","status":"Paid","created_at":"2026-04-17T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"636142c4-e1be-44ff-8db3-77aed5cdbb31","invoice_no":"INV-1011","patient_id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","appointment_id":null,"items":[{"qty": 1, "name": "Senior Wellness", "price": 3500}],"subtotal":3500,"discount":350,"tax":0,"total":3150,"paid":3150,"payment_mode":"Card","status":"Paid","created_at":"2026-03-30T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"bff46c1c-b561-46cb-a3a4-91eaea80f42b","invoice_no":"INV-1012","patient_id":"e44de894-ddd3-452d-94d8-30085a15dd51","appointment_id":null,"items":[{"qty": 1, "name": "Skin Cleanup", "price": 2500}],"subtotal":2500,"discount":0,"tax":0,"total":2500,"paid":2500,"payment_mode":"UPI","status":"Paid","created_at":"2026-03-15T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"01575f91-101f-4464-b924-e81e6de51bf9","invoice_no":"INV-1013","patient_id":"41af0d1c-40d7-4c41-9d11-0d26c0de97b0","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}],"subtotal":600,"discount":0,"tax":0,"total":600,"paid":600,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-20T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8fb8de8e-2190-4c04-9982-a5ce729c428e","invoice_no":"INV-1014","patient_id":"939d5daa-ce57-44b3-83ef-4009f8aee415","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}],"subtotal":600,"discount":0,"tax":0,"total":600,"paid":600,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-18T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"bb023be0-9cbe-42e5-86a1-27958d8489ca","invoice_no":"INV-1015","patient_id":"2c96548e-2cd9-4a53-8098-1989ba2d8491","appointment_id":null,"items":[{"qty": 1, "name": "Diabetes Care Plus", "price": 8500}],"subtotal":8500,"discount":850,"tax":0,"total":7650,"paid":7650,"payment_mode":"Card","status":"Paid","created_at":"2026-04-06T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"559c1bb5-c7b0-4213-b5ae-4bd632554fe1","invoice_no":"INV-1016","patient_id":"70803522-d19a-4b75-b33e-936dc98ce55e","appointment_id":null,"items":[{"qty": 1, "name": "Facial", "price": 3200}],"subtotal":3200,"discount":0,"tax":0,"total":3200,"paid":3200,"payment_mode":"UPI","status":"Paid","created_at":"2026-04-14T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"841c0ad8-4b7f-404e-ac5b-91c918207a9e","invoice_no":"INV-1017","patient_id":"bbcc8d89-62b2-47f3-a21b-217b672a81e9","appointment_id":null,"items":[{"qty": 1, "name": "Pediatric Consult", "price": 800}],"subtotal":800,"discount":0,"tax":0,"total":800,"paid":800,"payment_mode":"Cash","status":"Paid","created_at":"2026-04-02T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"49f9292d-4b87-45af-a7de-8dd19db61965","invoice_no":"INV-1018","patient_id":"8f3b6bd0-f922-4476-bf11-9964a09c9176","appointment_id":null,"items":[{"qty": 1, "name": "Consultation", "price": 600}],"subtotal":600,"discount":0,"tax":0,"total":600,"paid":0,"payment_mode":"UPI","status":"Pending","created_at":"2025-12-15T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: memberships
INSERT INTO public."memberships" SELECT * FROM json_populate_recordset(NULL::public."memberships", '[{"id":"39e50808-3a4d-4d03-acb5-a6d293f7fda3","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","package_id":"1e19eb37-29f2-4cbc-8e51-042d6f0f385f","sessions_used":3,"started_at":"2026-04-24","expires_at":"2026-08-02","status":"Active","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"130ff82d-3912-4aa3-97b8-74b82dd0e089","patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","package_id":"5cbed305-36f8-476b-9f46-da68c6f83ee1","sessions_used":2,"started_at":"2026-04-24","expires_at":"2026-06-23","status":"Active","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3e70c470-8e92-4b2f-9caa-330120a64977","patient_id":"8044183d-3d93-41e0-a433-067af0e99eed","package_id":"9fb9d856-8fa8-484c-9611-10083ce826c1","sessions_used":5,"started_at":"2026-04-24","expires_at":"2026-11-10","status":"Active","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: messages
INSERT INTO public."messages" SELECT * FROM json_populate_recordset(NULL::public."messages", '[{"id":"6829fcb5-04b8-4fac-8a93-d2dda0ae189e","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","channel":"WhatsApp","direction":"out","body":"Hi Aarav, your appointment tomorrow at 10 AM is confirmed.","status":"Read","template_name":"appointment_confirm","sent_at":"2026-04-23T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a5f23bc4-e0b7-467c-9642-e96b3cee2d98","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","channel":"WhatsApp","direction":"in","body":"Thanks! See you","status":"Read","template_name":null,"sent_at":"2026-04-23T16:59:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"4143a169-52ab-4527-9ffc-1cd9e69616fb","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","channel":"WhatsApp","direction":"out","body":"Hi Priya, your skin treatment is due. Book now: bit.ly/kfc-book","status":"Delivered","template_name":"retention","sent_at":"2026-04-22T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"c025b701-387c-4b05-bbb6-4a0e72a3a009","patient_id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","channel":"WhatsApp","direction":"out","body":"Hi Sneha, we missed you today! Reschedule with 10% off","status":"Read","template_name":"noshow","sent_at":"2026-04-14T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"70e65ef0-c1a6-4cd4-8d26-5cadb745dcdb","patient_id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","channel":"WhatsApp","direction":"out","body":"Hi Aditya, it''s been a while! Free consultation this week.","status":"Delivered","template_name":"winback","sent_at":"2026-04-19T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"7f9cacc5-5ebb-4c31-b6e3-833200611734","patient_id":"e44de894-ddd3-452d-94d8-30085a15dd51","channel":"WhatsApp","direction":"out","body":"Hi Riya, miss you at the clinic! 20% off your next visit.","status":"Read","template_name":"winback","sent_at":"2026-04-17T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"159985c0-7807-4dcf-925f-d06471d5d441","patient_id":"8044183d-3d93-41e0-a433-067af0e99eed","channel":"WhatsApp","direction":"out","body":"Thank you Karan! Please review us: g.page/kapoorclinic","status":"Read","template_name":"review_request","sent_at":"2026-04-04T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"51bbb827-b8fa-4cb7-bdf1-d86e889a458f","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","channel":"WhatsApp","direction":"out","body":"Diwali special — 20% off Skin Glow Pack just for you!","status":"Read","template_name":"campaign","sent_at":"2026-04-18T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"ef502a26-4305-4f14-bf4d-661bd8d9b8f7","patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","channel":"WhatsApp","direction":"out","body":"Reminder: HbA1c lab follow-up due this week.","status":"Delivered","template_name":"retention","sent_at":"2026-04-23T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6a1d7729-438a-4d12-bd31-c55d668fbd6d","patient_id":"8f53dcae-d151-4fe4-b0a0-9232c6559ef5","channel":"WhatsApp","direction":"out","body":"Hi! Vivaan''s next pediatric visit is due.","status":"Read","template_name":"retention","sent_at":"2026-04-21T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"ff89dcb3-bdaa-4cd2-ae60-5436487782b5","patient_id":"70803522-d19a-4b75-b33e-936dc98ce55e","channel":"WhatsApp","direction":"out","body":"Your facial appointment is confirmed for tomorrow 5 PM.","status":"Read","template_name":"appointment_confirm","sent_at":"2026-04-23T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"e14d5241-2ff4-4a64-be1e-6dc953384715","patient_id":"8f3b6bd0-f922-4476-bf11-9964a09c9176","channel":"WhatsApp","direction":"out","body":"Hi Pooja, free check-up offer — book now!","status":"Sent","template_name":"winback","sent_at":"2026-04-22T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"58c6ab6b-0793-4d0a-8630-33fe54ddc9d5","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","channel":"WhatsApp","direction":"out","body":"Hi","status":"Sent","template_name":null,"sent_at":"2026-04-24T17:38:42.371684+00:00","created_at":"2026-04-24T17:38:42.371684+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: reviews
INSERT INTO public."reviews" SELECT * FROM json_populate_recordset(NULL::public."reviews", '[{"id":"26600fcf-94a5-43bb-8a7e-6ce9e48e839b","patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","rating":5,"text":"Dr. Kapoor is wonderful. Very attentive and the staff is friendly!","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-20T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"d501a2d1-6532-4be2-85da-f130dbd0df9e","patient_id":"7b7c6bd3-ac78-4bc6-a716-5cd4eb859ccf","rating":5,"text":"Loved the skin treatment, results visible already.","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-13T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"829afcfe-af23-4851-b3fb-a8eb290a3c67","patient_id":"8044183d-3d93-41e0-a433-067af0e99eed","rating":5,"text":"Best clinic in Bandra. Highly recommend!","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-05T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"e2fb8e0a-aa90-4331-97aa-30825e895956","patient_id":"a952b570-63ba-4fa0-8dbf-f00dc464c234","rating":5,"text":"Dr. Iyer is amazing, my skin has never looked better","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-17T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"26da0ef9-1cf8-498a-aa5d-31ae5484d885","patient_id":"8f53dcae-d151-4fe4-b0a0-9232c6559ef5","rating":4,"text":"Pediatrician is great with kids","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-10T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"9bddef30-6994-4050-b698-29de8156dd1f","patient_id":"2c96548e-2cd9-4a53-8098-1989ba2d8491","rating":5,"text":"Diabetes care plan is well structured","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-07T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"9dea9c94-797a-4a40-85f1-57e8334273dd","patient_id":"70803522-d19a-4b75-b33e-936dc98ce55e","rating":4,"text":"Good experience overall","platform":"Practo","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-15T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"321ec96e-7bfa-496a-a024-799f5c8283a4","patient_id":"41af0d1c-40d7-4c41-9d11-0d26c0de97b0","rating":5,"text":"Quick appointment, no waiting","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-21T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b580ddf4-0217-4b18-b65e-9fe4933da7b0","patient_id":"6c4b5b4e-8011-4061-8edd-74b2e23ab3b7","rating":5,"text":"My daughter loves Dr. Mehta","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-18T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"1ce7d9da-d5c4-424a-95d7-75056363a618","patient_id":"939d5daa-ce57-44b3-83ef-4009f8aee415","rating":4,"text":"Clean and modern facility","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-19T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5fca04fa-2e25-4ea4-889b-3e0dcdd6bdf8","patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","rating":5,"text":"Excellent care for my diabetes","platform":"Practo","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-23T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5311f28f-5e5f-4f73-868f-44cd07eb1cfc","patient_id":"6feef8e5-181d-4b57-baf2-ec60fc64ab68","rating":5,"text":"Very professional and warm staff","platform":"Google","requested_at":"2026-04-24T16:54:24.316468+00:00","posted_at":"2026-04-24T16:54:24.316468+00:00","created_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: automations
INSERT INTO public."automations" SELECT * FROM json_populate_recordset(NULL::public."automations", '[{"id":"210da98d-b062-4c16-acb4-6dd4da6d7d72","name":"No-show recovery","description":"Auto WhatsApp + 10% offer when patient no-shows","trigger":"appointment.status=NoShow","conditions":{"delay_minutes": 120},"actions":[{"type": "whatsapp", "template": "noshow"}, {"type": "task", "assignee": "reception"}],"enabled":true,"runs_count":18,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5febace7-2320-4a93-be22-64dba7d9288c","name":"New patient follow-up","description":"7-day check-in for first-time patients","trigger":"appointment.completed","conditions":{"type": "New", "delay_days": 7},"actions":[{"type": "whatsapp", "template": "followup"}],"enabled":true,"runs_count":42,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"c59aaf1b-9b00-4396-b8bc-5d2b83871bdd","name":"Win-back 90+ days","description":"Reactivate dormant patients","trigger":"patient.last_visit>90d","conditions":{},"actions":[{"type": "whatsapp", "template": "winback"}, {"type": "add_to_campaign", "campaign": "Win-back"}],"enabled":true,"runs_count":24,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"755da161-c762-40b9-ad1c-03df4068cb5c","name":"Review request","description":"Ask for Google review after paid invoice","trigger":"invoice.paid","conditions":{"delay_hours": 2},"actions":[{"type": "whatsapp", "template": "review_request"}],"enabled":true,"runs_count":87,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"dd19b71f-79d6-4b8c-81b6-b0cba851dc99","name":"Birthday wish","description":"Send greeting with discount on birthday","trigger":"patient.birthday","conditions":{},"actions":[{"type": "whatsapp", "template": "birthday"}],"enabled":true,"runs_count":15,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"563193e6-8ccf-4b7d-b3ad-21ea89c64291","name":"Membership expiry alert","description":"Notify before membership expires","trigger":"membership.expiring","conditions":{"days_before": 15},"actions":[{"type": "whatsapp", "template": "renewal"}, {"type": "task", "assignee": "reception"}],"enabled":false,"runs_count":6,"last_run_at":null,"created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: tasks
INSERT INTO public."tasks" SELECT * FROM json_populate_recordset(NULL::public."tasks", '[{"id":"cbaa7d93-75ee-4986-98e4-1a1591be7faa","title":"Call Sneha for no-show reschedule","description":null,"assignee_id":"bd31b8db-d016-4737-b39e-cbe1a82b4062","related_patient_id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","due_at":"2026-04-24T20:54:24.316468+00:00","priority":"High","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"f4c3860a-9338-4036-bda9-8d10e6dc959a","title":"Confirm Aarav''s follow-up tomorrow","description":null,"assignee_id":"bd31b8db-d016-4737-b39e-cbe1a82b4062","related_patient_id":"05fd9a04-d9fe-4e74-a923-83d7c7a3881d","due_at":"2026-04-24T22:54:24.316468+00:00","priority":"Medium","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"ec8bf4ab-75db-48d8-9765-89c1ec3a6edd","title":"Win-back call to Aditya Verma","description":null,"assignee_id":"d962309d-720d-47f9-a566-6b01e6946a93","related_patient_id":"08ce2557-bbf5-4fe1-a1c2-dea24a71e579","due_at":"2026-04-25T16:54:24.316468+00:00","priority":"High","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"8e3cec8a-5bf1-4861-9167-fbeb9932267a","title":"Send invoice reminder to Sneha","description":null,"assignee_id":"a0d9d618-44dc-43f1-9a51-27142740875c","related_patient_id":"6cbed45f-e79f-449b-853a-0ab64722c4f1","due_at":"2026-04-24T18:54:24.316468+00:00","priority":"High","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"846d54a9-c3ad-4f9b-8f7d-4368f9026b2f","title":"Restock skin treatment supplies","description":null,"assignee_id":"f4627975-6966-4b29-9499-d817d7d3c76b","related_patient_id":null,"due_at":"2026-04-26T16:54:24.316468+00:00","priority":"Medium","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"b9c77903-8f3d-4c9f-aaea-78b227ed04e5","title":"Follow up Riya for win-back","description":null,"assignee_id":"d962309d-720d-47f9-a566-6b01e6946a93","related_patient_id":"e44de894-ddd3-452d-94d8-30085a15dd51","due_at":"2026-04-25T16:54:24.316468+00:00","priority":"Medium","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3f09c32a-c170-4963-9a12-f67440216ecc","title":"Verify lab reports for Rohan","description":null,"assignee_id":"653e2137-e10a-4427-bdee-e194642311b8","related_patient_id":"58121436-ab3e-42a4-9dd7-8ed52a8a485c","due_at":"2026-04-24T21:54:24.316468+00:00","priority":"High","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"5bff38e7-bac7-4371-8874-14a273bb2cf3","title":"Update WhatsApp templates","description":null,"assignee_id":"a0d9d618-44dc-43f1-9a51-27142740875c","related_patient_id":null,"due_at":"2026-04-27T16:54:24.316468+00:00","priority":"Low","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3c4c078c-2326-445e-ace4-838acca21b18","title":"Pediatric vaccine inventory check","description":null,"assignee_id":"f4627975-6966-4b29-9499-d817d7d3c76b","related_patient_id":null,"due_at":"2026-04-25T16:54:24.316468+00:00","priority":"Medium","status":"Done","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"2406a4ec-fd1b-4837-869a-3c3c563b4187","title":"Confirm tomorrow''s appointments","description":null,"assignee_id":"bd31b8db-d016-4737-b39e-cbe1a82b4062","related_patient_id":null,"due_at":"2026-04-25T00:54:24.316468+00:00","priority":"High","status":"Open","created_at":"2026-04-24T16:54:24.316468+00:00","updated_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

-- Table: activity_logs
INSERT INTO public."activity_logs" SELECT * FROM json_populate_recordset(NULL::public."activity_logs", '[{"id":"fe14a5c8-8ad1-4a2c-8c13-57c153fd48b5","actor":"Pooja Nair","action":"Created appointment","entity":"appointment","entity_id":null,"details":{"patient": "Aarav Sharma"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"c088d715-d698-4056-93c0-ff9585fb25aa","actor":"Arjun Singh","action":"Generated invoice","entity":"invoice","entity_id":null,"details":{"invoice_no": "INV-1003"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"a755040f-69ed-4976-bab3-8cdbca3e5d96","actor":"System","action":"Triggered automation","entity":"automation","entity_id":null,"details":{"name": "No-show recovery"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"6dd373ed-63d6-4364-ba18-d19365e03bab","actor":"Pooja Nair","action":"Sent WhatsApp campaign","entity":"campaign","entity_id":null,"details":{"name": "Diwali Skin Glow Offer"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3ad1091e-5d17-4f78-9cfb-af2e0205b3f6","actor":"Suresh Yadav","action":"Updated patient","entity":"patient","entity_id":null,"details":{"name": "Riya Bhat"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"aaf55d17-59fa-42ba-8157-8ad7222a610f","actor":"System","action":"Triggered automation","entity":"automation","entity_id":null,"details":{"name": "Review request"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"0441a39d-e2cd-439a-97da-326b71c1f3a3","actor":"Arjun Singh","action":"Created package","entity":"package","entity_id":null,"details":{"name": "Family Wellness"},"created_at":"2026-04-24T16:54:24.316468+00:00"}, {"id":"3afa1028-39bd-43fe-a314-02f94d2d0d47","actor":"Pooja Nair","action":"Marked completed","entity":"appointment","entity_id":null,"details":{"patient": "Karan Malhotra"},"created_at":"2026-04-24T16:54:24.316468+00:00"}]'::json) ON CONFLICT DO NOTHING;

COMMIT;

-- ===== realtime =====
