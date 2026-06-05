-- =============================================================
-- EcoScan AI V2.2 — Migración: P2P Eco-Points Transfer (B13)
-- Transferencias seguras entre estudiantes usando código de carnet
-- Fecha: 2026-06-05
-- =============================================================

-- 1. Tabla de historial de transferencias
CREATE TABLE IF NOT EXISTS p2p_transfers_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_carnet TEXT NOT NULL,
    receiver_carnet TEXT NOT NULL,
    amount INT NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_p2p_sender ON p2p_transfers_log(sender_id);
CREATE INDEX IF NOT EXISTS idx_p2p_receiver ON p2p_transfers_log(receiver_id);
CREATE INDEX IF NOT EXISTS idx_p2p_created ON p2p_transfers_log(created_at DESC);

-- 3. RLS — Cada usuario solo ve transferencias donde es emisor o receptor
ALTER TABLE p2p_transfers_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transfers"
    ON p2p_transfers_log
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 4. Función PL/pgSQL para transferencias atómicas
CREATE OR REPLACE FUNCTION execute_p2p_transfer(
    sender_uuid UUID,
    target_carnet TEXT,
    amount INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_balance INT;
    v_sender_carnet TEXT;
    v_receiver_id UUID;
    v_receiver_name TEXT;
    v_receiver_balance INT;
BEGIN
    -- Validación 1: El monto debe ser positivo
    IF amount <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El monto debe ser mayor a 0.'
        );
    END IF;

    -- Obtener datos del emisor
    SELECT eco_puntos, carnet_code
    INTO v_sender_balance, v_sender_carnet
    FROM profiles
    WHERE id = sender_uuid;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Perfil del emisor no encontrado.'
        );
    END IF;

    -- Validación 2: Saldo suficiente
    IF v_sender_balance < amount THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Saldo insuficiente. Tienes ' || v_sender_balance || ' eco-puntos disponibles.'
        );
    END IF;

    -- Validación 3: No auto-transferir
    IF UPPER(TRIM(target_carnet)) = UPPER(TRIM(v_sender_carnet)) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No puedes transferirte eco-puntos a ti mismo.'
        );
    END IF;

    -- Buscar receptor por carnet
    SELECT id, full_name, eco_puntos
    INTO v_receiver_id, v_receiver_name, v_receiver_balance
    FROM profiles
    WHERE UPPER(TRIM(carnet_code)) = UPPER(TRIM(target_carnet));

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El carnet "' || target_carnet || '" no está registrado en EcoScan AI.'
        );
    END IF;

    -- ====== TRANSACCIÓN ATÓMICA ======

    -- Restar puntos al emisor
    UPDATE profiles
    SET eco_puntos = eco_puntos - amount,
        updated_at = now()
    WHERE id = sender_uuid;

    -- Sumar puntos al receptor
    UPDATE profiles
    SET eco_puntos = eco_puntos + amount,
        updated_at = now()
    WHERE id = v_receiver_id;

    -- Registrar en el log histórico
    INSERT INTO p2p_transfers_log (
        sender_id, receiver_id,
        sender_carnet, receiver_carnet,
        amount
    ) VALUES (
        sender_uuid, v_receiver_id,
        v_sender_carnet, UPPER(TRIM(target_carnet)),
        amount
    );

    -- Retornar confirmación exitosa
    RETURN json_build_object(
        'success', true,
        'receiver_name', COALESCE(v_receiver_name, 'Estudiante'),
        'receiver_carnet', UPPER(TRIM(target_carnet)),
        'amount', amount,
        'new_balance', v_sender_balance - amount
    );

END;
$$;

-- 5. Documentación
COMMENT ON FUNCTION execute_p2p_transfer IS 'Transferencia atómica de eco-puntos entre estudiantes. Valida saldo, auto-transferencia y existencia del receptor.';
COMMENT ON TABLE p2p_transfers_log IS 'Historial de transferencias P2P de eco-puntos entre estudiantes de la UGB.';
