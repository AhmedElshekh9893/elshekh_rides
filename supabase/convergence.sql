-- ELSHEKH RIDES — Convergence migration
-- Run this in the Supabase SQL Editor (project: oybkrusmgbuhqqfavbko).
--
-- Covers convergence tasks:
--   T058  FK subscriptions.route_id -> routes(id)          (fixes /api/subscriptions 500)
--   T059  WITH CHECK on all policies + super_admin bypass
--   T062  schedules.status so DELETE becomes a status change (Constitution VII)
--
-- Safe to re-run: every statement is guarded.

-- ─────────────────────────────────────────────────────────────────────────────
-- T058 — subscriptions.route_id foreign key
-- ─────────────────────────────────────────────────────────────────────────────

-- Clean up any orphan rows first; the FK cannot be added while they exist.
UPDATE subscriptions s
SET route_id = (SELECT id FROM routes r WHERE r.tenant_id = s.tenant_id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM routes r WHERE r.id = s.route_id)
  AND EXISTS (SELECT 1 FROM routes r WHERE r.tenant_id = s.tenant_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_route_id_fkey'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_route_id_fkey
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- T062 — schedules.status (Constitution VII: no hard delete)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
    CREATE TYPE schedule_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS status schedule_status NOT NULL DEFAULT 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- T059 — WITH CHECK on every tenant-isolation policy + super_admin bypass
-- ─────────────────────────────────────────────────────────────────────────────
-- USING filters which rows are visible/updatable; WITH CHECK filters what a
-- row may become. Without WITH CHECK, INSERT is unconstrained (C-09).
-- Super Admin is cross-tenant, so it gets an explicit bypass (C-10).

-- Helper: is the caller a super_admin? Reads the trusted app_metadata claim.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

-- Helper: the caller's tenant_id, from the trusted claim.
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$;

-- Rebuild each policy with both USING and WITH CHECK, plus a super_admin bypass.

DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  USING (is_super_admin() OR id = current_tenant_id())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS user_tenant_isolation ON users;
CREATE POLICY user_tenant_isolation ON users
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS employee_tenant_isolation ON employees;
CREATE POLICY employee_tenant_isolation ON employees
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS subscription_tenant_isolation ON subscriptions;
CREATE POLICY subscription_tenant_isolation ON subscriptions
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS route_tenant_isolation ON routes;
CREATE POLICY route_tenant_isolation ON routes
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS route_stops_tenant_isolation ON route_stops;
CREATE POLICY route_stops_tenant_isolation ON route_stops
  USING (
    is_super_admin()
    OR route_id IN (SELECT id FROM routes WHERE tenant_id = current_tenant_id())
  )
  WITH CHECK (
    is_super_admin()
    OR route_id IN (SELECT id FROM routes WHERE tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS schedule_tenant_isolation ON schedules;
CREATE POLICY schedule_tenant_isolation ON schedules
  USING (
    is_super_admin()
    OR route_id IN (SELECT id FROM routes WHERE tenant_id = current_tenant_id())
  )
  WITH CHECK (
    is_super_admin()
    OR route_id IN (SELECT id FROM routes WHERE tenant_id = current_tenant_id())
  );

DROP POLICY IF EXISTS trip_tenant_isolation ON trips;
CREATE POLICY trip_tenant_isolation ON trips
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS vehicle_tenant_isolation ON vehicles;
CREATE POLICY vehicle_tenant_isolation ON vehicles
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS incident_tenant_isolation ON incidents;
CREATE POLICY incident_tenant_isolation ON incidents
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS invoice_tenant_isolation ON invoices;
CREATE POLICY invoice_tenant_isolation ON invoices
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

DROP POLICY IF EXISTS audit_log_tenant_isolation ON audit_logs;
CREATE POLICY audit_log_tenant_isolation ON audit_logs
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────────────────────

SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT policyname, cmd, qual IS NOT NULL AS has_using, with_check IS NOT NULL AS has_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
SELECT conname FROM pg_constraint WHERE conname = 'subscriptions_route_id_fkey';
