-- Create avatars storage bucket for 3D model files
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create avatar-images bucket for processed images
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-images', 'avatar-images', true);

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload their own avatar files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view avatar files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Same policies for avatar-images bucket
CREATE POLICY "Users can upload their own avatar images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatar-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatar-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view avatar images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatar-images');

CREATE POLICY "Users can delete their own avatar images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatar-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);