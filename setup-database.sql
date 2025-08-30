-- Tide Guard Collective Database Setup Script
-- Run this in your Supabase SQL Editor

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
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Create reports policies
CREATE POLICY "Users can view their own reports" ON reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON reports
FOR UPDATE USING (auth.uid() = user_id);

-- Allow authorities to view all reports
CREATE POLICY "Authorities can view all reports" ON reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'authority'
  )
);

-- Allow authorities to update all reports
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
CREATE POLICY "Users can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'incident-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Public can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

CREATE POLICY "Users can update their incident photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

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

-- 10. Insert sample data for testing (optional)
-- Uncomment the lines below if you want to create a test admin user

-- INSERT INTO profiles (id, full_name, role, points) 
-- VALUES ('your-user-id-here', 'Test Admin', 'authority', 100)
-- ON CONFLICT (id) DO UPDATE SET role = 'authority';

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER) TO authenticated;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points);

-- Success message
SELECT 'Database setup completed successfully!' as status;
