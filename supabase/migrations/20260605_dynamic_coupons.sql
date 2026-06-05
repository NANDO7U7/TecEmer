-- =============================================================
-- EcoScan AI V2.2 — Migración: dynamic_coupons (B14)
-- Cupones temporales con QR y expiración de 5 minutos
-- Fecha: 2026-06-05
-- =============================================================

-- 1. Crear tabla de cupones dinámicos
CREATE TABLE IF NOT EXISTS dynamic_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id TEXT NOT NULL,
    token_auth TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ
);

-- 2. Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_dynamic_coupons_user_id ON dynamic_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_coupons_token ON dynamic_coupons(token_auth);
CREATE INDEX IF NOT EXISTS idx_dynamic_coupons_expires ON dynamic_coupons(expires_at);

-- 3. Row Level Security (RLS) — Cada estudiante solo ve sus cupones
ALTER TABLE dynamic_coupons ENABLE ROW LEVEL SECURITY;

-- Política de lectura: el usuario solo puede leer sus propios cupones
CREATE POLICY "Users can read own dynamic coupons"
    ON dynamic_coupons
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política de inserción: el usuario solo puede crear cupones para sí mismo
CREATE POLICY "Users can create own dynamic coupons"
    ON dynamic_coupons
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política de actualización: solo marcar como usado sus propios cupones
CREATE POLICY "Users can update own dynamic coupons"
    ON dynamic_coupons
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Función para limpiar cupones expirados (limpieza automática)
CREATE OR REPLACE FUNCTION cleanup_expired_coupons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM dynamic_coupons
    WHERE expires_at < now() AND is_used = false;
END;
$$;

-- 5. Comentarios de documentación
COMMENT ON TABLE dynamic_coupons IS 'Cupones dinámicos con QR temporal para canje en UGB Store. Expiran a los 5 minutos.';
COMMENT ON COLUMN dynamic_coupons.token_auth IS 'Token aleatorio criptográfico que se codifica en el QR. Único por cupón.';
COMMENT ON COLUMN dynamic_coupons.reward_id IS 'Identificador del premio del catálogo COUPON_CATALOG (ej: ugb_store_10, cafeteria_15).';
COMMENT ON COLUMN dynamic_coupons.expires_at IS 'Timestamp de expiración (created_at + 5 minutos).';
