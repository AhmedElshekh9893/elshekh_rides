-- ELSHEKH RIDES Database Migration
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE tenant_status AS ENUM ('active', 'suspended');
CREATE TYPE user_role AS ENUM ('super_admin', 'operations_manager', 'dispatcher', 'fleet_manager', 'finance', 'support', 'company_admin', 'driver', 'customer');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE employee_status AS ENUM ('active', 'inactive');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE route_status AS ENUM ('active', 'inactive');
CREATE TYPE trip_status AS ENUM ('draft', 'scheduled', 'assigned', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show', 'failed');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');
CREATE TYPE incident_type AS ENUM ('driver_absent', 'vehicle_breakdown', 'delay', 'no_show', 'other');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'overdue', 'cancelled');

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text NOT NULL UNIQUE,
  role user_role NOT NULL,
  name text NOT NULL,
  phone text,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  phone text,
  status employee_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  route_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price numeric(10,2) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric(10,2),
  status route_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE route_stops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" integer NOT NULL,
  lat numeric(10,8),
  lng numeric(10,8)
);

CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  days text[] NOT NULL,
  departure_time time NOT NULL,
  return_time time
);

CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  route_id uuid NOT NULL REFERENCES routes(id),
  schedule_id uuid REFERENCES schedules(id),
  date date NOT NULL,
  status trip_status NOT NULL DEFAULT 'scheduled',
  driver_id uuid REFERENCES users(id),
  vehicle_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  plate text NOT NULL,
  type text NOT NULL,
  capacity integer NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'open',
  description text,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  amount numeric(10,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_employee ON subscriptions(employee_id);
CREATE INDEX idx_routes_tenant ON routes(tenant_id);
CREATE INDEX idx_trips_tenant ON trips(tenant_id);
CREATE INDEX idx_trips_date ON trips(date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX idx_incidents_trip ON incidents(trip_id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- RLS Policies
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
