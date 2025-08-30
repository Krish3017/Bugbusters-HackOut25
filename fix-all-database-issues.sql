-- Complete Database Fix for Mangrove Watch
-- Run this entire script in your Supabase SQL Editor

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'community' CHECK (role IN ('community', 'authority')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'resolved')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Create storage policies
DROP POLICY IF EXISTS "Users can upload incident photos" ON storage.objects;
CREATE POLICY "Users can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'incident-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view incident photos" ON storage.objects;
CREATE POLICY "Users can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'incident-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (bucket_id = 'incident-photos' AND auth.uid() IS NOT NULL);

-- 5. Create award_points function
CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- 7. Create RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
CREATE POLICY "Users can insert their own reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
CREATE POLICY "Users can update their own reports" ON reports
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

DROP POLICY IF EXISTS "Admins can update all reports" ON reports;
CREATE POLICY "Admins can update all reports" ON reports
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- 8. Create test data - first get the first user
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- If no user exists, create a test user profile
    IF first_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table';
        RETURN;
    END IF;
    
    -- Create profile for the first user if it doesn't exist
    INSERT INTO profiles (id, full_name, role, points)
    VALUES (first_user_id, 'Admin User', 'authority', 100)
    ON CONFLICT (id) DO UPDATE SET 
        role = 'authority',
        full_name = COALESCE(profiles.full_name, 'Admin User'),
        points = 100;
    
    -- Create test reports
    INSERT INTO reports (title, description, status, user_id, latitude, longitude) VALUES
    ('Mangrove Deforestation', 'Large area of mangroves being cleared for development', 'pending', first_user_id, 12.9716, 77.5946),
    ('Oil Spill in Coastal Area', 'Oil spill affecting marine life and mangroves', 'pending', first_user_id, 13.0827, 80.2707),
    ('Plastic Pollution', 'Heavy plastic waste accumulation in mangrove area', 'pending', first_user_id, 19.0760, 72.8777),
    ('Illegal Fishing', 'Commercial fishing vessels in protected mangrove zone', 'pending', first_user_id, 22.5726, 88.3639),
    ('Water Pollution', 'Industrial waste being discharged near mangrove forest', 'pending', first_user_id, 17.3850, 78.4867)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test data created successfully for user: %', first_user_id;
END $$;

-- 9. Verify the setup
SELECT '=== VERIFICATION ===' as info;
SELECT 'Total Users:' as metric, COUNT(*) as value FROM auth.users
UNION ALL
SELECT 'Total Profiles:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Total Reports:', COUNT(*) FROM reports
UNION ALL
SELECT 'Admin Users:', COUNT(*) FROM profiles WHERE role = 'authority'
UNION ALL
SELECT 'Pending Reports:', COUNT(*) FROM reports WHERE status = 'pending';

-- 10. Show final state
SELECT '=== ADMIN USERS ===' as info;
SELECT id, full_name, role, points FROM profiles WHERE role = 'authority';

SELECT '=== TEST REPORTS ===' as info;
SELECT id, title, status, created_at FROM reports ORDER BY created_at DESC LIMIT 5;
