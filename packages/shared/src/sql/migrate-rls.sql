-- Migration: Harden RLS policies + add missing columns
-- Run this in your Supabase SQL Editor if you already have the tables set up.

-- 1. Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_extension text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS care_circle_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS high_legibility boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender_identity text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Ensure profile rows exist for users created before trigger/policies were set
INSERT INTO public.profiles (id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Ensure auto-create profile trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Care Circle Alerts (for Emergency Mode)
CREATE TABLE IF NOT EXISTS public.care_circle_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  transcript text,
  note_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.care_circle_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.care_circle_alerts;
CREATE POLICY "Users can insert own alerts"
  ON public.care_circle_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own alerts" ON public.care_circle_alerts;
CREATE POLICY "Users can view own alerts"
  ON public.care_circle_alerts FOR SELECT
  USING (auth.uid() = user_id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS key_findings jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS medications jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Drop old broad "for all" policies and replace with explicit per-operation policies
-- This prevents any edge case where a user could trick a "for all" policy.

-- Health Notes
DROP POLICY IF EXISTS "Users can manage own notes" ON public.health_notes;
DROP POLICY IF EXISTS "Users can view own notes" ON public.health_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.health_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.health_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.health_notes;

CREATE POLICY "Users can view own notes"
  ON public.health_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.health_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.health_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.health_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Appointments
DROP POLICY IF EXISTS "Users can manage own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Profiles: add WITH CHECK to update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Storage: add delete policy
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage: enforce 10MB file size limit
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'documents';
