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
