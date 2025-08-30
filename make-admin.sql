-- Make Current User Admin
-- Run this after the complete setup script

-- First, let's see what users exist
SELECT id, email, created_at FROM auth.users;

-- Then, update your profile to be an admin
-- Replace 'your-email@example.com' with your actual email address
UPDATE profiles 
SET role = 'authority', 
    full_name = COALESCE(full_name, 'Admin User'),
    points = 100
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'  -- Replace with your email
);

-- Or if you want to make the first user an admin:
UPDATE profiles 
SET role = 'authority', 
    full_name = COALESCE(full_name, 'Admin User'),
    points = 100
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- Verify the change
SELECT id, full_name, role, points FROM profiles WHERE role = 'authority';
