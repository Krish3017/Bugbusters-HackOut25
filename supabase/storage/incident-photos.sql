-- Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload photos
CREATE POLICY "Users can upload incident photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'incident-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public read access to incident photos
CREATE POLICY "Public can view incident photos" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-photos');

-- Policy to allow users to update their own photos
CREATE POLICY "Users can update their incident photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own photos
CREATE POLICY "Users can delete their incident photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'incident-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
