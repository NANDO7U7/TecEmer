-- ============================================
-- EcoScan AI UGB — Supabase Database Schema
-- 3 Containers: Verde (Plástico), Amarillo (Latas), Negro (Común)
-- QR Validation for point claims
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (simplified)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  eco_puntos INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. RECYCLING_LOGS (3 materials + QR validation)
CREATE TABLE recycling_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  material TEXT NOT NULL CHECK (material IN ('plastico', 'lata', 'comun')),
  puntos_ganados INTEGER NOT NULL DEFAULT 0,
  qr_token TEXT,
  qr_validated BOOLEAN DEFAULT FALSE,
  qr_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recycling_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON recycling_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs"
  ON recycling_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs"
  ON recycling_logs FOR UPDATE USING (auth.uid() = user_id);

-- 3. UGB_COUPONS (store rewards)
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

CREATE POLICY "Users can view own coupons"
  ON ugb_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupons"
  ON ugb_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coupons"
  ON ugb_coupons FOR UPDATE USING (auth.uid() = user_id);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
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

-- 5. INDEXES
CREATE INDEX idx_recycling_logs_user_id ON recycling_logs(user_id);
CREATE INDEX idx_recycling_logs_created_at ON recycling_logs(created_at DESC);
CREATE INDEX idx_ugb_coupons_user_id ON ugb_coupons(user_id);
