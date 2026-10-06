# ELSHEKH RIDES — Implementation Tasks

## Phase 1: Setup

- [x] T001 Initialize Next.js project with TypeScript + Tailwind
- [x] T002 Setup Supabase project + environment variables
- [x] T003 Create database schema (all tables + relationships)
- [x] T004 Setup RLS policies for all tables
- [x] T005 Setup Supabase Auth + login/logout/refresh API routes
- [x] T006 Create AuthProvider abstraction layer
- [x] T007 Create NotificationProvider abstraction layer
- [x] T008 Create MapsProvider abstraction layer

## Phase 2: Core

- [x] T009 Create tenant management (CRUD + activate/suspend)
- [x] T010 Create user management (CRUD + roles)
- [x] T011 Create employee management (CRUD + link to company)
- [ ] T012 Create audit log system (middleware + table) — was marked [x] but the middleware never existed; audit wiring is now tracked as T063

## Phase 3: Operations

- [x] T013 Create routes management (CRUD + stops)
- [x] T014 Create schedules management
- [x] T015 Create drivers management
- [x] T016 Create vehicles management
- [x] T017 Create trips generation from schedules
- [x] T018 Create assignments (driver + vehicle + route + trip)
- [x] T019 Create Trip State Machine (transitions + validation)
- [x] T020 Create incidents management (CRUD + resolve)

## Phase 4: Dashboard

- [x] T021 Create Operations Dashboard layout (sidebar + topbar)
- [x] T022 Create KPIs component (trips, on-time rate, issues)
- [x] T023 Create Exceptions panel (incidents + delayed + unassigned)
- [x] T024 Create Live Trips table (upcoming + in progress)
- [x] T025 Create Trip detail panel (assign driver/vehicle, dispatch, cancel)
- [x] T026 Create Incident resolution workflow
- [x] T027 Create filters (date, route, driver, status, company)

## Phase 5: Driver App

- [x] T028 Create Driver App layout (mobile-first)
- [x] T029 Create Today's Trips list
- [x] T030 Create Trip execution flow (start → in progress → complete)
- [x] T031 Create Passenger manifest view
- [x] T032 Create Incident reporting

## Phase 6: Customer App

- [x] T033 Create Customer App layout (mobile-first)
- [x] T034 Create My Subscription view
- [x] T035 Create Upcoming Trip view
- [x] T036 Create Trip status tracking

## Phase 7: Company Portal

- [x] T037 Create Company Portal layout
- [x] T038 Create Employees management
- [x] T039 Create Subscriptions management
- [x] T040 Create Basic Reports

## Phase 8: Finance Lite

- [x] T041 Create Invoices management
- [x] T042 Create Payment status tracking
- [x] T043 Create Basic Expenses tracking

## Phase 9: Notifications

- [ ] T044 Setup FCM integration — was marked [x]; only a console.log stub existed. Real work tracked as T072
- [ ] T045 Create notification triggers (trip assigned, started, delayed, completed) — was marked [x]; zero call sites. Tracked as T072
- [ ] T046 Create notification preferences — was marked [x]; no table and no page exist

## Phase 10: Testing

- [x] T047 Unit tests — Trip State Machine
- [x] T048 Unit tests — Business rules (subscription, billing)
- [x] T049 Integration tests — Company → Employee → Subscription → Route → Trip
- [x] T050 API tests — Auth + Authorization + Tenant Isolation
- [ ] T051 RLS tests — Every role × every object — was marked [x]; the test file never existed. Tracked as T066
- [ ] T052 E2E test — Full operational day scenario — was marked [x]; the test file never existed. Tracked as T068
- [ ] T053 Security tests — Auth bypass, IDOR, privilege escalation — was marked [x]; the test file never existed. Tracked as T067
- [ ] T054 Performance tests — Dashboard queries, concurrent users — was marked [x]; the test file never existed

---

## Phase 11: Convergence

> مصدر المهام: `D:\Elshekh Reids\MD\00_ANALYZE_REPORT.md` (read-only analyze).
> **قواعد الـ Converge:** append-only — ممنوع إعادة كتابة أو ترقيم أو حذف أي مهمة
> سابقة. التصنيف بين قوسين: `(missing)` · `(partial)` · `(contradicts)` ·
> `(false-complete)`.
> الترتيب مفروض بالتبعيات: T055 → T057 حاجز (blockers) — كل واحد معطّل اللي بعده.

### Gate A — Blockers (مفيش حاجة شغالة بدونهم)

- [x] T055 Fix tenant_id source: read `app_metadata.tenant_id` instead of `user_metadata.tenant_id` in all 19 sites (contradicts) — ref C-06
- [x] T056 Add server-side Supabase client with user JWT (`@supabase/ssr` createServerClient + cookies) so `auth.getUser()` resolves in API routes (contradicts) — ref C-07
- [x] T057 Add login page + `src/middleware.ts` route guard for /dashboard, /driver, /customer, /company (missing) — ref C-11

### Gate B — Correctness (بيصلّح أعطال مؤكدة)

- [x] T058 Add FK constraint `subscriptions.route_id REFERENCES routes(id)` in supabase/schema.sql + migration (missing) — fixes /api/subscriptions 500, ref C-08 — APPLIED to live DB 2026-10-06 (verified via pg_constraint / information_schema / pg_policies)
- [x] T059 Add `WITH CHECK` clauses to all 12 RLS policies + super_admin bypass policy per plan.md (partial) — ref C-09, C-10 — APPLIED to live DB 2026-10-06 (verified via pg_constraint / information_schema / pg_policies)
- [x] T060 Enforce RBAC: role + permission scope check on all 26 API route files (contradicts) — ref C-01
- [x] T061 Add auth guard to the 10 unauthenticated GET endpoints (employees/[id], invoices/[id], routes/[id], schedules, schedules/[id], subscriptions/[id], tenants/[id], trips/[id], users/[id], vehicles/[id]) (contradicts) — ref C-02

### Gate C — Constitution Compliance

- [x] T062 Remove all 10 hard `.delete()` calls; replace with status changes (cancelled/inactive/retired) per Constitution VII (contradicts) — ref C-03 — APPLIED to live DB 2026-10-06 (verified via pg_constraint / information_schema / pg_policies)
- [x] T063 Wire `logAudit()` into trip transitions + all sensitive operations per Constitution VI (contradicts) — ref C-04
- [x] T064 Extract shared state machine: API transition route must import from `src/lib/trip-state-machine.ts`, and PATCH /api/trips/[id] must validate status through it (partial) — ref M-08, M-09

### Gate D — Verification (Constitution IX)

- [x] T065 Replace literal-only tests with tests that import and exercise real code (api/business-rules/integration) (contradicts) — ref C-05
- [ ] T066 Add RLS tests: every role × every object × every operation (missing) — ref T051
- [ ] T067 Add security tests: auth bypass, IDOR, privilege escalation, tenant isolation (missing) — ref T053
- [ ] T068 Add E2E test: full operational day scenario (missing) — ref T052

### Gate E — Ledger Integrity

- [x] T069 Correct tasks.md status: un-mark T012, T044, T045, T046, T051, T052, T053, T054 (marked [x], not implemented) (false-complete)
- [ ] T070 Create `checklists/*.md` requirement-quality checklists per saas-kit lifecycle (missing) — ref M-06
- [x] T071 Add pagination (limit/offset) to all list GET endpoints per Constitution XIII (missing) — ref M-07

### Backlog (خارج MVP — بعد ما النواة تشتغل)

- [ ] T072 Implement real FCM notification provider + wire notify* calls (missing) — ref M-03
- [ ] T073 Implement Google Maps provider (geocode/route/eta currently return 0 with TODO) (missing) — ref M-04
- [ ] T074 Add missing endpoints from plan.md: /api/assignments, /api/reports/operational (missing) — ref M-01
- [ ] T075 Add missing tables from spec.md: assignments, payments (missing) — ref M-02
- [ ] T076 Add error handling (try/catch) to all API routes (partial) — ref P-01
- [ ] T077 Fix Vercel custom domain (elshekhrides.vercel.app returns 404) + review deployment protection (partial) — ref P-05, P-06
- [ ] T078 Add CI/CD pipeline (missing) — ref P-03
