-- Check Database Status
-- Run this to see the current state of your database

-- 1. Check if tables exist
SELECT '=== TABLE STATUS ===' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('profiles', 'reports') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'reports');

-- 2. Check if storage bucket exists
SELECT '=== STORAGE BUCKET STATUS ===' as info;
SELECT 
    id,
    name,
    CASE 
        WHEN id = 'incident-photos' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM storage.buckets 
WHERE id = 'incident-photos';

-- 3. Check if award_points function exists
SELECT '=== FUNCTION STATUS ===' as info;
SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'award_points' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'award_points';

-- 4. Check users and profiles
SELECT '=== USER STATUS ===' as info;
SELECT 
    'Total Users:' as metric,
    COUNT(*) as value 
FROM auth.users
UNION ALL
SELECT 
    'Total Profiles:',
    COUNT(*) 
FROM profiles
UNION ALL
SELECT 
    'Admin Users:',
    COUNT(*) 
FROM profiles 
WHERE role = 'authority';

-- 5. Check reports
SELECT '=== REPORT STATUS ===' as info;
SELECT 
    'Total Reports:' as metric,
    COUNT(*) as value 
FROM reports
UNION ALL
SELECT 
    'Pending Reports:',
    COUNT(*) 
FROM reports 
WHERE status = 'pending'
UNION ALL
SELECT 
    'Verified Reports:',
    COUNT(*) 
FROM reports 
WHERE status = 'verified';

-- 6. Show admin users
SELECT '=== ADMIN USERS ===' as info;
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.points,
    u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'authority';

-- 7. Show recent reports
SELECT '=== RECENT REPORTS ===' as info;
SELECT 
    id,
    title,
    status,
    created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;
