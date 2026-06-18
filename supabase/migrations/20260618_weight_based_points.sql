-- =============================================================
-- EcoScan AI — Migración: weight_based_points
-- Configuración de puntos por peso y registro de peso
-- Fecha: 2026-06-18
-- =============================================================

-- 1. Crear tabla para la configuración de puntos por peso
CREATE TABLE IF NOT EXISTS public.weight_points_config (
    material TEXT PRIMARY KEY CHECK (material IN ('plastico', 'lata', 'comun')),
    points_per_kg NUMERIC NOT NULL DEFAULT 100,
    points_per_lb NUMERIC NOT NULL DEFAULT 45,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.weight_points_config ENABLE ROW LEVEL SECURITY;

-- 2. Crear Políticas RLS
-- Lectura pública para que estudiantes vean las reglas y administradores configuren
CREATE POLICY "Anyone can select weight_points_config"
    ON public.weight_points_config
    FOR SELECT
    USING (true);

-- Solo administradores pueden insertar
CREATE POLICY "Admins can insert weight_points_config"
    ON public.weight_points_config
    FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Solo administradores pueden actualizar
CREATE POLICY "Admins can update weight_points_config"
    ON public.weight_points_config
    FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 3. Insertar valores predeterminados (Plástico, Lata, Común)
INSERT INTO public.weight_points_config (material, points_per_kg, points_per_lb) VALUES
    ('plastico', 500, 227),
    ('lata', 1000, 454),
    ('comun', 0, 0)
ON CONFLICT (material) DO NOTHING;

-- 4. Modificar recycling_logs para soportar registro por peso
ALTER TABLE public.recycling_logs 
ADD COLUMN IF NOT EXISTS peso NUMERIC,
ADD COLUMN IF NOT EXISTS unidad_peso TEXT CHECK (unidad_peso IN ('kg', 'lb'));

-- Comentarios
COMMENT ON TABLE public.weight_points_config IS 'Configuración global de puntos asignados por cada unidad de peso (kilogramos y libras) de material.';
COMMENT ON COLUMN public.recycling_logs.peso IS 'Peso del desecho reciclado si se registra por peso (en kg o lb).';
COMMENT ON COLUMN public.recycling_logs.unidad_peso IS 'Unidad de medida del peso registrado: kg o lb.';
