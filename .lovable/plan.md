
# ClinicOS — Clinic Growth & Operations Platform

A vibrant, glossy, India-first "Operating System for Clinics" focused on growth, retention, revenue, and staff efficiency. Strictly **non-clinical** (no EMR/prescriptions/diagnoses).

---

## 1. 🎨 Visual Direction

- **Palette**: vibrant gradients — purple (#7C3AED) → pink (#EC4899) → orange (#F97316), with deep slate base and white glassmorphism cards
- **Style**: glossy buttons with gradient borders, soft neon glows, frosted-glass panels, micro-animations on hover, smooth page transitions
- **Typography**: Inter for UI, gradient-stroked numerals for KPIs
- **Iconography**: Lucide icons everywhere; colored icon chips on every list item / KPI / nav entry
- **Density**: information-rich but breathable; rounded-2xl cards; subtle shimmer on loading

---

## 2. 🔐 Authentication

- Single hardcoded credential gate (no Supabase Auth needed) — username **Marchello** / password **Kapoorz123$** (validated client-side, **not displayed** anywhere on the login page)
- Beautiful gradient login screen with clinic branding, "Sign in to ClinicOS" CTA
- Auth state persisted in localStorage; protected routes redirect to /login
- Logout button in top bar

---

## 3. 🏗️ Architecture & Stack

- **Frontend**: React + Vite + TypeScript + Tailwind + shadcn/ui + Recharts + react-router
- **Backend**: Lovable Cloud (Supabase) — Postgres + Edge Functions
- **AI**: Lovable AI Gateway → `google/gemini-2.5-flash` (free tier) for AI Insights tab
- **State**: TanStack Query for server cache; local UI state via React
- **Communications**: Simulated WhatsApp/SMS — messages composed, queued, status tracked in DB (sent/delivered/read mocked on a timer)

---

## 4. 🗄️ Database Schema (Lovable Cloud)

All tables seeded with **15–20 Indian-context records**, INR currency, realistic names (Aarav Sharma, Priya Patel, Dr. Rajesh Kapoor, etc.), Indian phone numbers, cities (Mumbai, Bengaluru, Delhi, Pune).

| Table | Key Columns |
|---|---|
| `patients` | id, name, phone, email, gender, dob, city, source (Walk-in/Google/Referral/WhatsApp/Instagram), tags[], lifetime_value, last_visit, status |
| `doctors` | id, name, specialization, consultation_fee, avatar_color |
| `staff` | id, name, role (Receptionist/Nurse/Admin), phone, status |
| `appointments` | id, patient_id, doctor_id, scheduled_at, duration_min, status (Booked/CheckedIn/Completed/NoShow/Cancelled), token_no, type (New/Followup/Walkin) |
| `invoices` | id, patient_id, appointment_id, items (jsonb), subtotal, discount, tax, total, paid, payment_mode (UPI/Cash/Card), status, created_at |
| `packages` | id, name, services[], price, validity_days, sessions_total |
| `memberships` | id, patient_id, package_id, sessions_used, expires_at |
| `campaigns` | id, name, channel (WhatsApp/SMS), audience_filter, template, sent_count, delivered, opened, booked, revenue_attributed |
| `messages` | id, patient_id, channel, body, direction, status, sent_at |
| `leads` | id, name, phone, source, campaign_id, status (New/Contacted/Booked/Lost), created_at |
| `reviews` | id, patient_id, rating, text, platform, requested_at, posted_at |
| `tasks` | id, title, assignee_staff_id, related_patient_id, due_at, priority, status |
| `automations` | id, name, trigger, conditions (jsonb), actions (jsonb), enabled, runs_count |
| `activity_logs` | id, actor, action, entity, entity_id, timestamp |
| `settings` | clinic_name, logo_url, working_hours, slot_duration, currency, timezone, theme_color |

Full CRUD wired through Supabase client with RLS open for the demo (single-tenant).

---

## 5. 🧭 Navigation (Left Sidebar)

Glossy collapsible sidebar with gradient active-state pills:

1. Dashboard
2. AI Insights ✨
3. Appointments & Queue
4. Patients (CRM)
5. Billing & Revenue
6. Communications (WhatsApp)
7. Campaigns & Leads
8. Reviews & Referrals
9. Staff & Tasks
10. Automations
11. Reports
12. Admin Panel (CMS + Settings)

Top bar: smart global search, clinic switcher chip, notifications bell, staff avatar menu.

---

## 6. 📱 Core Modules (Fully Functional in v1)

### A. Dashboard (clickable everywhere)
- KPI tiles: Today's Appointments, Today's Revenue (₹), New Patients (week), No-show Rate, Pending Follow-ups, Active Campaigns ROI
- Charts (Recharts): Revenue trend (30d area chart), Appointments by status (donut), Patient acquisition by source (stacked bar), Top doctors by revenue (horizontal bar), Hourly footfall heatmap, Retention cohort mini-chart
- "Today's Live Queue" widget
- "Patients at risk of churn" list
- **Every tile/chart/legend item is clickable** → deep-links to filtered view in the relevant module

### B. AI Insights ✨ (separate top-level tab)
- **Auto-generated insight cards** (refresh button): revenue trend interpretation, no-show pattern, retention risk patients, top growth opportunity, campaign winners, staff efficiency note — each card calls Gemini via edge function with summarized DB stats
- **Chat panel**: user asks questions ("Which doctor has the best follow-up rate?", "How can I increase MRR next month?"), edge function feeds clinic data context + Gemini response, streams answer with markdown rendering and suggested follow-up chips
- All grounded strictly in CRM data; commercial-value framing built into system prompt

### C. Appointments & Queue
- Calendar view (day/week) + Live Queue board (Waiting → In Consultation → Done with token numbers)
- **Custom Date+Time Picker (3 clicks)**:
  - Click 1: opens popover — left side small current-month calendar, right side big spread of 30-min slots from **6:00 AM to 11:30 PM** in **12-hour format with AM/PM**
  - Click 2: pick a date (calendar highlights, slots refresh to show availability)
  - Click 3: pick a time slot → popover closes, value committed
- Drag to reschedule, no-show one-tap, walk-in token generator, wait-time prediction badge

### D. Patients (CRM) — Advanced Data Grid
Showcases ALL grid features (reused across all list views):
- **Sticky column headers** when scrolling
- **Resizable columns** (drag handle on header edge)
- **Click header to sort** (asc/desc/none cycling, arrow icon)
- **Per-column filters** (text/number/date/dropdown depending on type)
- **Smart global search** (fuzzy across all columns)
- **Edit Mode toggle** — Google-Sheets-style inline editing: click cell to edit, dropdowns inline, Enter/Tab to commit, autosave to DB
- **Row selection checkboxes** + Select-All → action bar appears with **Bulk Edit** dialog (apply field changes to all selected rows in one DB call), Bulk Delete, Bulk WhatsApp, Bulk Tag
- Patient detail drawer: timeline (visits, payments, messages), LTV, tags, quick-actions (Book, Message, Invoice)

### E. Billing & Revenue
- Invoice list with same advanced grid
- Create invoice: line items, package application, discount, tax, INR totals, payment mode, mark paid
- Revenue analytics sub-tab: MTD/QTD revenue, payment-mode split donut, outstanding dues, package sales, ARPU
- Packages & Memberships management

### F. Communications (Simulated WhatsApp)
- Inbox-style threaded view per patient
- Template library (gradient cards), variable interpolation `{{name}} {{date}}`
- Click-to-action buttons: Book / Pay / Reply (mock callbacks update DB)
- Broadcast composer with audience filter preview

---

## 7. 🧱 Modules with Polished UI + Seeded Data (read-mostly in v1)

These are fully navigable, look beautiful, show real seeded data, support search/sort/filter, but heavy automation logic is v2:
- **Campaigns & Leads** — campaign cards with ROI, lead pipeline kanban
- **Reviews & Referrals** — review request flow, NPS, referral tracker
- **Staff & Tasks** — staff list, task board, performance leaderboard
- **Automations** — visual rule list ("If no-show → WhatsApp after 2hrs → Task to receptionist"), toggle on/off, runs counter
- **Reports** — exportable summary reports

---

## 8. 🛠️ Admin Panel (CMS + Advanced Settings)

Dedicated "Admin" section with sub-tabs:
- **Clinic Profile**: name, logo upload, address, working hours, slot duration, currency
- **CMS — Templates**: edit WhatsApp/SMS templates, landing page copy, review request text — all live-editable, persisted to DB
- **CMS — Packages & Pricing**: full CRUD on offerings shown to patients
- **Users & Roles**: staff CRUD with role assignments (Doctor/Receptionist/Admin/Nurse) — visual role matrix
- **Automation Rules**: enable/disable/edit rules
- **Theme & Branding**: pick gradient preset, accent color, dark/light
- **Activity Log**: searchable audit trail
- **Data Tools**: export CSV per table, reset demo data

---

## 9. 🔄 Key Automation Examples (visualized)

- **No-show recovery**: status=NoShow → WhatsApp template "We missed you" + 10% off → task to reception after 24h
- **Follow-up**: appointment Completed + type=New → WhatsApp 7 days later asking how patient feels
- **Reactivation**: last_visit > 90 days → WhatsApp offer + add to "Win-back" campaign
- **Review request**: invoice paid → 2h later WhatsApp with Google review link

---

## 10. 📊 KPIs Surfaced

Patient growth %, Retention rate, No-show %, ARPU, MRR from memberships, Campaign ROI, Avg wait time, Staff productivity, Lost-patient count, Follow-up compliance %.

---

## 11. 🚀 What ships in this build (MVP)

✅ Auth gate · ✅ Lovable Cloud + 15 tables seeded with Indian data · ✅ Dashboard with clickable insights · ✅ AI Insights tab (cards + chat via Gemini edge function) · ✅ Appointments + 3-click date/time picker · ✅ Patients CRM with full advanced grid (sort/filter/resize/sticky/inline-edit/bulk-edit/smart-search) · ✅ Billing + Revenue analytics · ✅ Simulated WhatsApp comms · ✅ Polished UI for Campaigns/Leads/Reviews/Staff/Tasks/Automations/Reports with seeded data · ✅ Admin Panel with CMS + Settings · ✅ Glossy gradient design system · ✅ All links functional

---

## 12. 🧠 Why this wins vs HealthPlix

- **Zero clinical complexity** → receptionist-friendly, 5-min onboarding
- **WhatsApp-first** → matches India reality
- **AI Insights commercially framed** → tells owner exactly how to make more money
- **Automation engine** → compounds value daily
- **One screen, one click** philosophy → addictive daily-use product

Click **Implement plan** to build it.
