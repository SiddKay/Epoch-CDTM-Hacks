
-- Create a storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical_documents', 'Medical Documents', true)
ON CONFLICT (id) DO NOTHING;

-- Add policy to allow public access to the bucket
CREATE POLICY "Public Access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical_documents')
ON CONFLICT DO NOTHING;

-- Add policy to allow Grandma user to insert objects
CREATE POLICY "Grandma Upload Access" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical_documents' AND auth.uid()::text = '3fa85f64-5717-4562-b3fc-2c963f66afa6');

-- Add policy to allow Grandma user to update objects
CREATE POLICY "Grandma Update Access" 
ON storage.objects 
FOR UPDATE
USING (bucket_id = 'medical_documents' AND auth.uid()::text = '3fa85f64-5717-4562-b3fc-2c963f66afa6');

-- Add policy to allow Grandma user to delete objects
CREATE POLICY "Grandma Delete Access" 
ON storage.objects 
FOR DELETE
USING (bucket_id = 'medical_documents' AND auth.uid()::text = '3fa85f64-5717-4562-b3fc-2c963f66afa6');
