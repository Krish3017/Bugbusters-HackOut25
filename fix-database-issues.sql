-- Quick Fix for Storage Bucket and Award Points Function Issues
-- Run this in your Supabase SQL Editor

-- 1. Create the award_points function (if it doesn't exist)
CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create storage bucket for incident photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create storage policies (if they don't exist)
CREATE POLICY IF NOT EXISTS "Users can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'incident-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Public can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

CREATE POLICY IF NOT EXISTS "Users can update their incident photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their incident photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.award_points(UUID, INTEGER) TO authenticated;

-- Success message
SELECT 'Database issues fixed successfully!' as status;
