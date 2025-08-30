-- Make Specific User Admin by Email
-- Replace 'your-email@example.com' with your actual email address

-- First, let's see what users exist
SELECT '=== ALL USERS ===' as info;
SELECT id, email, created_at FROM auth.users;

-- Make your specific user an admin
UPDATE profiles 
SET role = 'authority', 
    full_name = COALESCE(full_name, 'Admin User'),
    points = 100
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'  -- REPLACE WITH YOUR EMAIL
);

-- Create profile if it doesn't exist
INSERT INTO profiles (id, full_name, role, points)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
    'authority',
    100
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- REPLACE WITH YOUR EMAIL
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- Verify the change
SELECT '=== ADMIN USERS ===' as info;
SELECT id, full_name, role, points FROM profiles WHERE role = 'authority';

-- Show your user specifically
SELECT '=== YOUR USER ===' as info;
SELECT p.id, p.full_name, p.role, p.points, u.email 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL
