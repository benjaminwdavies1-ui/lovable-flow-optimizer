-- Create storage bucket for recording screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to screenshots
CREATE POLICY "Public can view screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'screenshots');

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);