'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface IdentifiedUser {
    id: string;
    name: string;
    full_name: string;
    carnet: string;
    carnet_code: string;
    eco_puntos: number;
    total_scans: number;
    avatar_url: string | null;
    faculty_id: string | null;
}

type IdentityStatus = 'idle' | 'scanning' | 'matched' | 'not_found' | 'error';

// UGB carnet code pattern: 4 uppercase letters + 6 digits (e.g., SMSS141122)
const UGB_CARNET_PATTERN = /[A-Z]{2,5}\d{4,8}/;

export function useIdentity() {
    const [status, setStatus] = useState<IdentityStatus>('idle');
    const [identifiedUser, setIdentifiedUser] = useState<IdentifiedUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Extract a UGB carnet code from raw text (simulating OCR output)
     */
    const extractCarnetCode = useCallback((rawText: string): string | null => {
        const cleaned = rawText.toUpperCase().replace(/\s/g, '');
        const match = cleaned.match(UGB_CARNET_PATTERN);
        return match ? match[0] : null;
    }, []);

    /**
     * Look up a user by their carnet code in Supabase
     */
    const lookupByCarnet = useCallback(async (carnetCode: string): Promise<IdentifiedUser | null> => {
        const { data, error: dbError } = await supabase
            .from('profiles')
            .select('id, name, carnet, eco_puntos, total_scans, avatar_url, faculty_id')
            .eq('carnet', carnetCode)
            .single();

        if (dbError || !data) return null;
        
        return {
            id: data.id,
            name: data.name || '',
            full_name: data.name || '',
            carnet: data.carnet || '',
            carnet_code: data.carnet || '',
            eco_puntos: data.eco_puntos || 0,
            total_scans: data.total_scans || 0,
            avatar_url: data.avatar_url,
            faculty_id: data.faculty_id
        };
    }, []);

    /**
     * Main identification flow: extract code → look up user
     */
    const identifyFromText = useCallback(async (ocrText: string) => {
        setStatus('scanning');
        setError(null);

        const code = extractCarnetCode(ocrText);
        if (!code) {
            setStatus('not_found');
            setError('No se detectó un código de carnet válido (formato: SMSS141122)');
            return null;
        }

        const user = await lookupByCarnet(code);
        if (!user) {
            setStatus('not_found');
            setError(`Carnet "${code}" no registrado en el sistema`);
            return null;
        }

        setIdentifiedUser(user);
        setStatus('matched');
        return user;
    }, [extractCarnetCode, lookupByCarnet]);

    /**
     * Manual carnet code entry (fallback)
     */
    const identifyByCode = useCallback(async (code: string) => {
        setStatus('scanning');
        setError(null);

        const cleaned = code.toUpperCase().replace(/\s/g, '');
        if (!UGB_CARNET_PATTERN.test(cleaned)) {
            setStatus('not_found');
            setError('Formato de carnet no válido (ej: SMSS141122)');
            return null;
        }

        const user = await lookupByCarnet(cleaned);
        if (!user) {
            setStatus('not_found');
            setError(`Carnet "${cleaned}" no encontrado`);
            return null;
        }

        setIdentifiedUser(user);
        setStatus('matched');
        return user;
    }, [lookupByCarnet]);

    /**
     * Auto-assign points after successful deposit (replaces QR flow)
     */
    const assignPoints = useCallback(async (
        userId: string,
        material: 'plastico' | 'lata' | 'comun',
        points: number
    ) => {
        // Insert recycling log
        await supabase.from('recycling_logs').insert({
            user_id: userId,
            material,
            puntos_ganados: points,
            qr_validated: true, // auto-validated via identity
        });

        // Update profile stats
        if (points > 0) {
            await supabase.rpc('increment_eco_puntos', {
                user_id_input: userId,
                points_to_add: points,
            }).then(({ error: rpcError }) => {
                // Fallback if RPC doesn't exist
                if (rpcError) {
                    return supabase
                        .from('profiles')
                        .update({
                            eco_puntos: (identifiedUser?.eco_puntos || 0) + points,
                            total_scans: (identifiedUser?.total_scans || 0) + 1,
                        })
                        .eq('id', userId);
                }
            });
        } else {
            await supabase
                .from('profiles')
                .update({
                    total_scans: (identifiedUser?.total_scans || 0) + 1,
                })
                .eq('id', userId);
        }
    }, [identifiedUser]);

    const reset = useCallback(() => {
        setStatus('idle');
        setIdentifiedUser(null);
        setError(null);
    }, []);

    return {
        status,
        identifiedUser,
        error,
        identifyFromText,
        identifyByCode,
        assignPoints,
        reset,
        extractCarnetCode,
    };
}
