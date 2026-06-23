# ClinicOS — Full Project Backup

**Backup created (UTC):** 2026-04-27
**Project:** ClinicOS — Clinic Growth & Operations Platform
**Lovable Project ID:** `2bdadfc8-63be-4b14-825c-6f1db405288f`
**Supabase Project Ref:** `ctdpzzcmfydbogidljfw`
**Backend:** Lovable Cloud (managed Supabase)

This backup is a fully self-contained snapshot of the database structure, all
row data, security policies, edge functions, and project configuration
required to recreate the project from scratch.

---

## 📂 Folder Structure

```
full_project_backup_2026-04-27/
├── database/
│   ├── schema/               # Tables, constraints, indexes, sequences, views, extensions
│   │   ├── 00_extensions.sql
│   │   ├── 01_tables.sql
│   │   ├── 02_constraints.sql
│   │   ├── 03_indexes.sql
│   │   ├── 04_sequences.sql
│   │   ├── 05_views.sql
│   │   └── 06_matviews.sql
│   ├── data/                 # Per-table JSON + CSV exports (full data)
│   ├── migrations/           # Original Supabase migration files
│   ├── functions/            # All public.* function definitions
│   ├── triggers/             # All trigger definitions
│   ├── policies/             # All RLS policies (with ENABLE ROW LEVEL SECURITY)
│   ├── roles/                # Role names + GRANT statements on public schema
│   ├── _tables.txt           # Master list of public tables
│   └── restore_all.sql       # ⭐ Single-file end-to-end restore script
├── edge-functions/           # Deno edge functions (e.g. ai-insights)
├── storage/                  # Storage buckets + storage RLS policies (JSON)
├── config/
│   ├── config.toml           # Supabase project config
│   ├── package.json          # Frontend dependency versions snapshot
│   ├── realtime.sql          # Realtime publication membership
│   ├── cron_jobs.sql         # pg_cron schedule (empty if none)
│   ├── project_info.json     # Project IDs, URLs, secret name inventory
│   └── .env.example          # Environment variable template (no values)
├── seeds/
│   └── seed_data.sql         # Idempotent INSERT-based seed for all tables
├── BACKUP_SUMMARY.md         # Counts of every object + row counts per table
└── README.md                 # (this file)
```

---

## 🔐 Sensitive Files Excluded

For security, the following are **NOT** included and must be re-supplied
when restoring:

- Real `.env` values — only `.env.example` template is shipped.
- Supabase service-role key, JWT signing keys, vault-encrypted secrets.
- `LOVABLE_API_KEY` (used by edge functions for the AI Gateway).
- Auth user passwords / OAuth client secrets.

The names of the secrets that must exist in the destination project are
listed in `config/project_info.json → secrets_present_in_supabase`.

---

## 🛠 Required Dependencies

- **PostgreSQL 15+** (Supabase-managed recommended)
- **Supabase CLI** ≥ 1.150 (for edge function deploys)
- **Deno** ≥ 1.40 (edge function runtime)
- **Node.js 20+ / Bun 1.x** (frontend build)
- Postgres extensions (auto-installed by `00_extensions.sql`):
  `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`

---

## 🔄 Restoration Instructions

### Option A — One-shot restore (recommended)

```bash
# 1. Provision a fresh Supabase / Postgres database
# 2. Run the consolidated restore script
psql "$DATABASE_URL" -f database/restore_all.sql
```

This executes, in order:
extensions → sequences → tables → constraints → indexes → views →
materialized views → functions → triggers → RLS policies → grants →
seed data → realtime publication.

### Option B — Granular / staged restore

```bash
psql "$DATABASE_URL" -f database/schema/00_extensions.sql
psql "$DATABASE_URL" -f database/schema/01_tables.sql
psql "$DATABASE_URL" -f database/schema/02_constraints.sql
psql "$DATABASE_URL" -f database/schema/03_indexes.sql
psql "$DATABASE_URL" -f database/functions/functions.sql
psql "$DATABASE_URL" -f database/triggers/triggers.sql
psql "$DATABASE_URL" -f database/policies/policies.sql
psql "$DATABASE_URL" -f database/roles/grants.sql
psql "$DATABASE_URL" -f seeds/seed_data.sql
psql "$DATABASE_URL" -f config/realtime.sql
```

### Edge functions

```bash
cp -r edge-functions/* supabase/functions/
supabase functions deploy ai-insights
# Set required secrets:
supabase secrets set LOVABLE_API_KEY=...
```

### Frontend / project config

1. Copy `config/.env.example` → project root `.env`, fill in URL + anon key.
2. `bun install` (versions pinned in `config/package.json`).
3. `bun run dev`.

### Storage

`storage/buckets.json` and `storage/policies.json` are empty in this
snapshot (no buckets defined). If buckets are added later, recreate them
via the Supabase dashboard or `storage.create_bucket()`.

---

## ✅ Verification Steps

After restore, confirm the snapshot is intact:

```sql
-- 1. Table count must equal 15
SELECT count(*) FROM pg_tables WHERE schemaname='public';

-- 2. Row counts must match BACKUP_SUMMARY.md
SELECT 'patients' tbl, count(*) FROM patients
UNION ALL SELECT 'appointments', count(*) FROM appointments
UNION ALL SELECT 'invoices',     count(*) FROM invoices
-- ... etc
;

-- 3. Every table has RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';

-- 4. Policies present
SELECT tablename, count(*) FROM pg_policies
WHERE schemaname='public' GROUP BY tablename;

-- 5. Trigger present
SELECT tgname FROM pg_trigger WHERE NOT tgisinternal;
```

Cross-check against `BACKUP_SUMMARY.md`.

---

## 📊 What's Included (counts)

See **`BACKUP_SUMMARY.md`** for the authoritative tally:

- 15 tables, all with RLS policies (4 per table)
- 1 database function (`update_updated_at_column`)
- 12 triggers (auto-updating `updated_at`)
- 21 indexes, 27 constraints
- 1 edge function (`ai-insights`)
- 1 migration file
- 0 storage buckets, 0 cron jobs (none defined yet)
- ~143 rows of seed data across all tables

---

## ⚠️ Notes

- All `public.*` tables currently use permissive demo RLS policies
  (`USING true`). When restoring to production, harden policies before
  exposing the anon key.
- The `auth`, `storage`, `realtime`, `supabase_functions`, and `vault`
  schemas are managed by Supabase and intentionally **not** dumped.
- This backup preserves `gen_random_uuid()` defaults and `now()` timestamp
  defaults so re-inserts behave identically.
- The backup uses `INSERT … ON CONFLICT DO NOTHING` for seed data, making
  the restore safely re-runnable.
