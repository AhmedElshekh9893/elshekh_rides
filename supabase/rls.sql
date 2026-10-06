ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants
  USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY user_tenant_isolation ON users
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY employee_tenant_isolation ON employees
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY subscription_tenant_isolation ON subscriptions
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY route_tenant_isolation ON routes
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY route_stops_tenant_isolation ON route_stops
  USING (route_id IN (SELECT id FROM routes WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY schedule_tenant_isolation ON schedules
  USING (route_id IN (SELECT id FROM routes WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY trip_tenant_isolation ON trips
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY vehicle_tenant_isolation ON vehicles
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY incident_tenant_isolation ON incidents
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY invoice_tenant_isolation ON invoices
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY audit_log_tenant_isolation ON audit_logs
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
