-- Run this in Supabase SQL Editor after creating the user

-- Create ELSHEKH tenant
INSERT INTO tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'ELSHEKH', 'active')
ON CONFLICT (id) DO NOTHING;

-- Update user role to super_admin and link to tenant
UPDATE users
SET
  role = 'super_admin',
  tenant_id = '00000000-0000-0000-0000-000000000000',
  name = 'Ahmed Elshekh'
WHERE email = 'ahmed_elshekh@elshekh.car';

-- Verify
SELECT id, email, role, tenant_id, name FROM users WHERE email = 'ahmed_elshekh@elshekh.car';
