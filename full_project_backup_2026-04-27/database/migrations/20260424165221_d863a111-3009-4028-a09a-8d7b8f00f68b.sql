
-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- DOCTORS
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  consultation_fee NUMERIC NOT NULL DEFAULT 500,
  phone TEXT,
  avatar_color TEXT DEFAULT 'purple',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STAFF
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'Active',
  performance_score INT DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PATIENTS
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  dob DATE,
  city TEXT,
  source TEXT DEFAULT 'Walk-in',
  tags TEXT[] DEFAULT '{}',
  lifetime_value NUMERIC DEFAULT 0,
  last_visit DATE,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INT DEFAULT 30,
  status TEXT DEFAULT 'Booked',
  type TEXT DEFAULT 'New',
  token_no INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PACKAGES
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  services TEXT[] DEFAULT '{}',
  price NUMERIC NOT NULL,
  validity_days INT DEFAULT 90,
  sessions_total INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MEMBERSHIPS
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  sessions_used INT DEFAULT 0,
  started_at DATE DEFAULT CURRENT_DATE,
  expires_at DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  payment_mode TEXT DEFAULT 'UPI',
  status TEXT DEFAULT 'Paid',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT DEFAULT 'WhatsApp',
  audience_filter TEXT,
  template TEXT,
  status TEXT DEFAULT 'Active',
  sent_count INT DEFAULT 0,
  delivered INT DEFAULT 0,
  opened INT DEFAULT 0,
  booked INT DEFAULT 0,
  revenue_attributed NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'WhatsApp',
  direction TEXT DEFAULT 'out',
  body TEXT NOT NULL,
  status TEXT DEFAULT 'Sent',
  template_name TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  source TEXT DEFAULT 'Google',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'New',
  notes TEXT,
  estimated_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  rating INT NOT NULL,
  text TEXT,
  platform TEXT DEFAULT 'Google',
  requested_at TIMESTAMPTZ DEFAULT now(),
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TASKS
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  related_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AUTOMATIONS
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  runs_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SETTINGS (singleton)
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT DEFAULT 'Kapoor Family Clinic',
  tagline TEXT DEFAULT 'Care that grows with you',
  address TEXT DEFAULT 'Bandra West, Mumbai 400050',
  phone TEXT DEFAULT '+91 98765 43210',
  email TEXT DEFAULT 'hello@kapoorclinic.in',
  working_hours TEXT DEFAULT 'Mon-Sat: 9:00 AM - 9:00 PM',
  slot_duration INT DEFAULT 30,
  currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  theme_gradient TEXT DEFAULT 'purple-pink-orange',
  whatsapp_template_followup TEXT DEFAULT 'Hi {{name}}, hope you''re feeling better! Time for your follow-up at Kapoor Clinic. Reply YES to book.',
  whatsapp_template_noshow TEXT DEFAULT 'Hi {{name}}, we missed you today! Reschedule with 10% off — reply BOOK to confirm.',
  whatsapp_template_review TEXT DEFAULT 'Thank you for visiting, {{name}}! Please share your experience: {{link}}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS + permissive policies (demo behind shared login)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['doctors','staff','patients','appointments','packages','memberships','invoices','campaigns','messages','leads','reviews','tasks','automations','activity_logs','settings'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "demo_all_select" ON public.%I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_insert" ON public.%I FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_update" ON public.%I FOR UPDATE USING (true);', t);
    EXECUTE format('CREATE POLICY "demo_all_delete" ON public.%I FOR DELETE USING (true);', t);
  END LOOP;
END $$;

-- Triggers for updated_at
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['doctors','staff','patients','appointments','packages','memberships','invoices','campaigns','leads','tasks','automations','settings'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;

-- Indexes
CREATE INDEX idx_appts_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_appts_status ON public.appointments(status);
CREATE INDEX idx_invoices_created ON public.invoices(created_at);
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_messages_patient ON public.messages(patient_id);
