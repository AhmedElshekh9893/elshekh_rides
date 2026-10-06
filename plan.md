# ELSHEKH RIDES — Technical Plan

## Stack

- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Next.js API Routes + Supabase
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth
- RLS: Supabase Row Level Security
- Maps: Google Maps (via abstraction layer)
- Notifications: FCM (via abstraction layer)
- State Management: React Context + React Query

## Architecture

```
Next.js App (Frontend + API)
        ↓
   Supabase Client
        ↓
PostgreSQL + RLS + Auth
```

## Provider Abstraction

```typescript
interface AuthProvider {
  login(email, password): Promise<User>
  logout(): Promise<void>
  refresh(): Promise<Token>
}

interface NotificationProvider {
  send(userId, title, body, data): Promise<void>
}

interface MapsProvider {
  geocode(address): Promise<Coordinates>
  route(origin, destination, stops): Promise<RouteInfo>
  eta(origin, destination): Promise<number>
}
```

## Database Schema (Core)

### tenants
- id (uuid, pk)
- name (text)
- status (enum: active, suspended)
- created_at, updated_at

### users
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- email (text)
- role (enum: super_admin, operations_manager, dispatcher, fleet_manager, finance, support, company_admin, driver, customer)
- name (text)
- phone (text)
- status (enum: active, inactive)
- created_at, updated_at

### employees
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- user_id (uuid, fk → users, nullable)
- name (text)
- phone (text)
- status (enum: active, inactive)
- created_at, updated_at

### subscriptions
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- employee_id (uuid, fk → employees)
- route_id (uuid, fk → routes)
- start_date (date)
- end_date (date)
- price (numeric)
- status (enum: active, expired, cancelled)
- created_at, updated_at

### routes
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- name (text)
- origin (text)
- destination (text)
- distance_km (numeric)
- status (enum: active, inactive)
- created_at, updated_at

### route_stops
- id (uuid, pk)
- route_id (uuid, fk → routes)
- name (text)
- order (integer)
- lat (numeric)
- lng (numeric)

### schedules
- id (uuid, pk)
- route_id (uuid, fk → routes)
- days (text[]) — ['mon', 'tue', ...]
- departure_time (time)
- return_time (time, nullable)

### trips
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- route_id (uuid, fk → routes)
- schedule_id (uuid, fk → schedules)
- date (date)
- status (enum: draft, scheduled, assigned, ready, in_progress, completed, cancelled, no_show, failed)
- driver_id (uuid, fk → users, nullable)
- vehicle_id (uuid, fk → vehicles, nullable)
- started_at (timestamp, nullable)
- completed_at (timestamp, nullable)
- created_at, updated_at

### vehicles
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- plate (text)
- type (text)
- capacity (integer)
- status (enum: available, in_use, maintenance, retired)
- created_at, updated_at

### incidents
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- trip_id (uuid, fk → trips)
- type (enum: driver_absent, vehicle_breakdown, delay, no_show, other)
- severity (enum: low, medium, high, critical)
- status (enum: open, in_progress, resolved)
- description (text)
- resolved_by (uuid, fk → users, nullable)
- resolved_at (timestamp, nullable)
- created_at, updated_at

### invoices
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- subscription_id (uuid, fk → subscriptions)
- amount (numeric)
- status (enum: draft, issued, paid, overdue, cancelled)
- due_date (date)
- created_at, updated_at

### audit_logs
- id (uuid, pk)
- tenant_id (uuid, fk → tenants)
- actor_id (uuid, fk → users)
- action (text)
- entity_type (text)
- entity_id (uuid)
- old_value (jsonb, nullable)
- new_value (jsonb, nullable)
- created_at (timestamp)

## RLS Policies

- كل جدول له tenant_id → RLS policy: `tenant_id = auth.jwt() ->> 'tenant_id'`
- Super Admin يتجاوز الـ RLS
- كل Role يشوف بس البيانات اللي الـ tenant بتاعه فيها

## API Routes

```
/api/auth/login
/api/auth/logout
/api/auth/refresh
/api/companies
/api/employees
/api/subscriptions
/api/routes
/api/trips
/api/trips/[id]/transition
/api/assignments
/api/drivers
/api/vehicles
/incidents
/api/invoices
/api/reports/operational
```

## Validation

- Zod schemas لكل API
- Client validation = UX only
- Server validation = authoritative
