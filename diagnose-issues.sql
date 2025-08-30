-- Diagnostic Script to Check and Fix Issues
-- Run this in your Supabase SQL Editor

-- 1. Check what users exist
SELECT '=== USERS ===' as info;
SELECT id, email, created_at FROM auth.users;

-- 2. Check what profiles exist
SELECT '=== PROFILES ===' as info;
SELECT id, full_name, role, points FROM profiles;

-- 3. Check what reports exist
SELECT '=== REPORTS ===' as info;
SELECT id, title, status, user_id, created_at FROM reports;

-- 4. Check if there are any reports with invalid user_id
SELECT '=== REPORTS WITH INVALID USER_ID ===' as info;
SELECT r.id, r.title, r.user_id, r.status 
FROM reports r 
LEFT JOIN auth.users u ON r.user_id = u.id 
WHERE u.id IS NULL;

-- 5. Fix reports by associating them with the first user
SELECT '=== FIXING REPORTS ===' as info;
UPDATE reports 
SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 6. Make the first user an admin
SELECT '=== MAKING FIRST USER ADMIN ===' as info;
UPDATE profiles 
SET role = 'authority', 
    full_name = COALESCE(full_name, 'Admin User'),
    points = 100
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- 7. Create a profile for the first user if it doesn't exist
INSERT INTO profiles (id, full_name, role, points)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
    'authority',
    100
FROM auth.users u
WHERE u.id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- 8. Verify the fix
SELECT '=== VERIFICATION ===' as info;
SELECT 'Total Users:' as metric, COUNT(*) as value FROM auth.users
UNION ALL
SELECT 'Total Profiles:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Total Reports:', COUNT(*) FROM reports
UNION ALL
SELECT 'Admin Users:', COUNT(*) FROM profiles WHERE role = 'authority'
UNION ALL
SELECT 'Valid Reports:', COUNT(*) FROM reports r JOIN auth.users u ON r.user_id = u.id;

-- 9. Show final state
SELECT '=== FINAL STATE ===' as info;
SELECT id, full_name, role, points FROM profiles WHERE role = 'authority';
SELECT id, title, status, user_id FROM reports LIMIT 5;
