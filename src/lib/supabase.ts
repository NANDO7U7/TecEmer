import { createClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================
export interface Profile {
    id: string;
    full_name: string | null;
    eco_puntos: number;
    total_scans: number;
    updated_at: string;
}

export interface RecyclingLog {
    id: string;
    user_id: string;
    material: 'plastico' | 'lata' | 'comun';
    puntos_ganados: number;
    created_at: string;
}

export interface UGBCoupon {
    id: string;
    user_id: string;
    code: string;
    description: string;
    discount_percent: number;
    puntos_cost: number;
    is_redeemed: boolean;
    created_at: string;
}

// ============================================
// 3 Bins Configuration
// ============================================
export type BinType = 'plastico' | 'lata' | 'comun';

export const BIN_INFO: Record<BinType, {
    label: string;
    color: string;
    hex: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    gradientClass: string;
    serialChar: string;
    emoji: string;
    points: number;
}> = {
    plastico: {
        label: 'Botellas de Plástico',
        color: 'bg-green-500',
        hex: '#22C55E',
        bgClass: 'bg-green-50',
        textClass: 'text-green-700',
        borderClass: 'border-green-400',
        gradientClass: 'from-green-400 to-green-600',
        serialChar: 'P',
        emoji: '🟢',
        points: 15,
    },
    lata: {
        label: 'Latas',
        color: 'bg-amber-400',
        hex: '#F59E0B',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-400',
        gradientClass: 'from-amber-400 to-amber-500',
        serialChar: 'L',
        emoji: '🟡',
        points: 20,
    },
    comun: {
        label: 'Basura Común',
        color: 'bg-gray-800',
        hex: '#1F2937',
        bgClass: 'bg-gray-50',
        textClass: 'text-gray-700',
        borderClass: 'border-gray-600',
        gradientClass: 'from-gray-600 to-gray-800',
        serialChar: 'C',
        emoji: '⚫',
        points: 0,
    },
};

// ============================================
// UGB Store Coupons Catalog
// ============================================
export const COUPON_CATALOG = [
    { description: '10% descuento en UGB Store', discount_percent: 10, puntos_cost: 100 },
    { description: '15% descuento en cafetería UGB', discount_percent: 15, puntos_cost: 150 },
    { description: '20% descuento en librería UGB', discount_percent: 20, puntos_cost: 250 },
    { description: '25% descuento en UGB Store', discount_percent: 25, puntos_cost: 400 },
    { description: 'Café gratis en cafetería UGB', discount_percent: 100, puntos_cost: 500 },
];

// ============================================
// Supabase Client
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
