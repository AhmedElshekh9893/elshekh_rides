# ELSHEKH RIDES — SaaS Spec

## Goal

منصة B2B لإدارة نقل الموظفين للشركات — من الاشتراك حتى تنفيذ الرحلة والتحصيل، مع Multi-Tenancy و RBAC و Audit Trail.

## Scope

### In Scope (MVP)

- Identity & Security: Auth, Users, Roles, Permissions, Tenant Isolation, RLS, Audit Logs
- Companies: إنشاء/تعديل/تفعيل/تعطيل + إدارة الموظفين
- Vehicles: بيانات أساسية + حالة التشغيل
- Drivers: بروفايل + حالة + تطبيق مبسط
- Routes: Origin, Destination, Stops, Distance, Schedule
- Subscriptions: Employee → Subscription → Route مع تاريخ وسعر وحالة
- Trips: State Machine كاملة + Exceptions
- Operations Dashboard: Exception-first + Action-oriented + Desktop-first
- Driver App: تنفيذ الرحلات + تحديث الحالة
- Customer App: متابعة الاشتراك والرحلة
- Company Portal: إدارة الموظفين والاشتراكات والتقارير الأساسية
- Finance Lite: فواتير + حالة دفع + مصروفات أساسية
- Notifications: Push للرحلات والتأخيرات والتنبيهات

### Out of Scope (First Release)

- SaaS Marketplace / Public signup / Self-service onboarding
- Advanced Analytics / AI / Predictive maintenance
- Advanced Fleet Management (fuel, depreciation, workshop)
- Payment Gateway كامل (فواتير + تسويات يدوية مؤقتًا)
- Advanced Financial (payroll engine, tax, bank reconciliation)
- Complex dynamic pricing

## User Flow

```
Company Created → Employee Added → Subscription Created → Route Created
→ Driver Created → Vehicle Created → Trip Generated → Driver Assigned
→ Vehicle Assigned → Driver Starts → Passenger Notified → Trip Completed
→ Audit Recorded → Basic Billing/Report Updated
```

## Requirements

### Functional

- FR-001: إنشاء وإدارة الشركات (CRUD + تفعيل/تعطيل)
- FR-002: إدارة الموظفين وربطهم بالشركة
- FR-003: إنشاء وإدارة الاشتراكات (Employee → Route)
- FR-004: إنشاء وإدارة الـ Routes مع الـ Stops
- FR-005: إدارة السائقين والمركبات
- FR-006: توليد الرحلات من الـ Schedules
- FR-007: إسناد السائق والمركبة للرحلة
- FR-008: تنفيذ الـ Trip State Machine كاملة
- FR-009: إدارة الـ Incidents والـ Exceptions
- FR-010: Operations Dashboard — عرض الاستثناءات أولاً
- FR-011: Driver App — تنفيذ الرحلات
- FR-012: Customer App — متابعة الرحلة
- FR-013: Company Portal — إدارة الموظفين والاشتراكات
- FR-014: Finance Lite — فواتير + حالة دفع
- FR-015: إشعارات Push للأحداث التشغيلية

### Non-Functional

- NFR-001: Multi-Tenant Isolation على مستوى الـ Database (RLS)
- NFR-002: RBAC مع Permission Scopes
- NFR-003: Audit Trail لكل العمليات الحساسة
- NFR-004: PostgreSQL = Source of Truth
- NFR-005: Provider Abstraction (Auth, Maps, Notifications)
- NFR-006: Free-tier-conscious architecture
- NFR-007: Pagination + Caching
- NFR-008: Desktop-first للـ Operations, Mobile-first للـ Driver/Customer

## Frontend

- App Shell: Sidebar + Topbar
- Operations Dashboard: High-density, Exception-first, Action-oriented
- Driver App: Mobile-first, تنفيذ الرحلات
- Customer App: Mobile-first, متابعة الرحلة
- Company Portal: Desktop/Web

## Backend

- Auth: Supabase Auth (قابل للاستبدال عبر abstraction)
- API: REST
- Database: PostgreSQL / Supabase
- RLS: على كل الجداول
- Audit Logs: لكل transition وعملية حساسة

## Database

### Core Entities

- tenants (companies)
- users (مع role + tenant_id)
- employees (مرتبطين بالشركة)
- subscriptions (employee → route)
- routes (مع stops)
- schedules
- trips (مع state machine)
- assignments (driver + vehicle + route + trip)
- drivers
- vehicles
- incidents
- invoices
- payments
- audit_logs

### Relationships

```
Tenant 1:N Users
Tenant 1:N Employees
Employee 1:N Subscriptions
Route 1:N Trips
Trip 1:1 Assignment
Assignment N:1 Driver
Assignment N:1 Vehicle
Trip 1:N Incidents
Tenant 1:N Invoices
```

## APIs

- Auth: login, logout, refresh
- Companies: CRUD
- Employees: CRUD
- Subscriptions: CRUD
- Routes: CRUD + Stops
- Trips: CRUD + State Transitions
- Assignments: CRUD
- Drivers: CRUD
- Vehicles: CRUD
- Incidents: CRUD + Resolve
- Invoices: CRUD
- Reports: Operational metrics

## UI/UX

- Operations: Control Center — Exceptions first, KPIs, Live Trips, Map
- Driver: قائمة رحلات اليوم + تنفيذ + تحديث حالة
- Customer: اشتراكي + رحلتي القادمة + حالة الرحلة
- Company: موظفين + اشتراكات + تقارير أساسية

## Edge Cases

- Driver absent → Incident → Reassign
- Vehicle breakdown → Incident → Replace + Notify
- Trip delayed → Update ETA → Notify → Audit
- Network failure → لا تكرار الرحلات + عدم فقدان البيانات
- Tenant A لا يصل لبيانات Tenant B (RLS)

## Security

- Auth: Supabase Auth + JWT
- Authorization: RBAC + Permission Scopes
- RLS: على كل الجداول
- Audit: لكل transition وعملية حساسة
- لا hard delete للبيانات التشغيلية والمالية

## Testing

- Unit: State Machine, Business Rules
- Integration: Company → Employee → Subscription → Route → Trip
- API: Success + Validation + Auth + Authorization + Tenant Isolation
- RLS: لكل Role × لكل Object
- E2E: سيناريو يوم تشغيل كامل
- Security: Auth bypass, IDOR, Tenant isolation, Privilege escalation
- Performance: Dashboard queries, Concurrent users

## Implementation Steps

1. Setup: Supabase project + Auth + RLS policies
2. Core: Tenants + Users + Roles + Permissions
3. Operations: Routes + Drivers + Vehicles + Trips + Assignments
4. Dashboard: Operations Control Center
5. Driver App: تنفيذ الرحلات
6. Customer App: متابعة الرحلة
7. Company Portal: إدارة الموظفين والاشتراكات
8. Finance Lite: فواتير + مدفوعات
9. Notifications: Push
10. Testing: Unit + Integration + E2E + Security
