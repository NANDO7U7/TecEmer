-- ============================================
-- EcoScan AI UGB — Supabase Database Schema
-- V2.2 — Faculties, Badges, Eco-Bot
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FACULTIES
CREATE TABLE faculties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4A7C34',
  emoji TEXT NOT NULL DEFAULT '🏛️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO faculties (name, short_name, color, emoji) VALUES
  ('Ingeniería y Arquitectura', 'ING', '#3B82F6', '⚙️'),
  ('Ciencias Jurídicas', 'DER', '#EF4444', '⚖️'),
  ('Ciencias Económicas', 'ECO', '#F59E0B', '📊'),
  ('Ciencias de la Salud', 'SAL', '#10B981', '🏥'),
  ('Ciencias y Humanidades', 'HUM', '#8B5CF6', '📚')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view faculties" ON faculties FOR SELECT USING (true);

-- 2. PROFILES (with faculty)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  eco_puntos INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  faculty_id UUID REFERENCES faculties(id),
  carnet_code TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. RECYCLING_LOGS (3 materials + QR + location)
CREATE TABLE recycling_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  material TEXT NOT NULL CHECK (material IN ('plastico', 'lata', 'comun')),
  puntos_ganados INTEGER NOT NULL DEFAULT 0,
  qr_token TEXT,
  qr_validated BOOLEAN DEFAULT FALSE,
  qr_expires_at TIMESTAMPTZ,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recycling_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON recycling_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON recycling_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON recycling_logs FOR UPDATE USING (auth.uid() = user_id);

-- 4. UGB_COUPONS (store rewards)
CREATE TABLE ugb_coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  puntos_cost INTEGER NOT NULL DEFAULT 100,
  is_redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ugb_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupons" ON ugb_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupons" ON ugb_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coupons" ON ugb_coupons FOR UPDATE USING (auth.uid() = user_id);

-- 5. ECO_BADGES (digital certificates)
CREATE TABLE eco_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  shared BOOLEAN DEFAULT FALSE
);

ALTER TABLE eco_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON eco_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON eco_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own badges" ON eco_badges FOR UPDATE USING (auth.uid() = user_id);

-- 6. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INDEXES
CREATE INDEX idx_recycling_logs_user_id ON recycling_logs(user_id);
CREATE INDEX idx_recycling_logs_created_at ON recycling_logs(created_at DESC);
CREATE INDEX idx_ugb_coupons_user_id ON ugb_coupons(user_id);
CREATE INDEX idx_profiles_faculty_id ON profiles(faculty_id);
CREATE INDEX idx_eco_badges_user_id ON eco_badges(user_id);
