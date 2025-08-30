-- Complete Database Setup for Mangrove Watch
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

-- 3. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. Create profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authorities to view all profiles
DROP POLICY IF EXISTS "Authorities can view all profiles" ON profiles;
CREATE POLICY "Authorities can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- 5. Create reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
CREATE POLICY "Users can insert their own reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
CREATE POLICY "Users can update their own reports" ON reports
FOR UPDATE USING (auth.uid() = user_id);

-- Allow authorities to view all reports
DROP POLICY IF EXISTS "Authorities can view all reports" ON reports;
CREATE POLICY "Authorities can view all reports" ON reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- Allow authorities to update all reports
DROP POLICY IF EXISTS "Authorities can update all reports" ON reports;
CREATE POLICY "Authorities can update all reports" ON reports
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- 6. Create award_points function
CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create storage policies
DROP POLICY IF EXISTS "Users can upload incident photos" ON storage.objects;
CREATE POLICY "Users can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'incident-photos' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Public can view incident photos" ON storage.objects;
CREATE POLICY "Public can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

DROP POLICY IF EXISTS "Users can update their incident photos" ON storage.objects;
CREATE POLICY "Users can update their incident photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their incident photos" ON storage.objects;
CREATE POLICY "Users can delete their incident photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 9. Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, points)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'community', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER) TO authenticated;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);

-- 12. Create test data for demonstration
-- First, let's create a test admin user (you'll need to replace this with your actual user ID)
-- To find your user ID, go to Authentication > Users in your Supabase dashboard

-- Create test reports (these will be associated with a dummy user ID)
-- You can replace the user_id with your actual user ID from the auth.users table

INSERT INTO reports (id, title, description, status, user_id, created_at) VALUES
(
  gen_random_uuid(),
  'Mangrove Deforestation Near Beach',
  'Large area of mangroves has been cleared for development. This is affecting the local ecosystem and wildlife habitat.',
  'pending',
  (SELECT id FROM auth.users LIMIT 1),
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'Oil Spill in Coastal Waters',
  'Significant oil spill detected in the coastal area. Wildlife is being affected and immediate action is needed.',
  'pending',
  (SELECT id FROM auth.users LIMIT 1),
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'Plastic Pollution on Shoreline',
  'Massive amount of plastic waste washed up on the beach. This is a serious environmental concern.',
  'verified',
  (SELECT id FROM auth.users LIMIT 1),
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  'Illegal Fishing Activity',
  'Observed illegal fishing practices in protected marine area. Boats are using prohibited fishing methods.',
  'resolved',
  (SELECT id FROM auth.users LIMIT 1),
  NOW() - INTERVAL '5 days'
),
(
  gen_random_uuid(),
  'Coral Reef Damage',
  'Coral reef shows signs of bleaching and damage. This could be due to climate change or human activity.',
  'pending',
  (SELECT id FROM auth.users LIMIT 1),
  NOW() - INTERVAL '6 hours'
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! Test reports have been created.' as status;
