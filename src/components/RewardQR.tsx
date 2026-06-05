'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================
interface DynamicCoupon {
    id: string;
    user_id: string;
    reward_id: string;
    token_auth: string;
    created_at: string;
    expires_at: string;
    is_used: boolean;
}

interface RewardQRProps {
    userId: string;
    rewardId: string;
    rewardLabel: string;
    discountPercent: number;
    onClose: () => void;
}

// ============================================
// Utilities
// ============================================
const COUPON_LIFETIME_SECONDS = 300; // 5 minutes

function generateToken(): string {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// Component
// ============================================
export default function RewardQR({
    userId,
    rewardId,
    rewardLabel,
    discountPercent,
    onClose,
}: RewardQRProps) {
    const [coupon, setCoupon] = useState<DynamicCoupon | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(COUPON_LIFETIME_SECONDS);
    const [isExpired, setIsExpired] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ------------------------------------------
    // Generate a new dynamic coupon
    // ------------------------------------------
    const generateCoupon = useCallback(async () => {
        setIsGenerating(true);
        setError(null);
        setIsExpired(false);

        try {
            const token = generateToken();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + COUPON_LIFETIME_SECONDS * 1000);

            const { data, error: insertError } = await supabase
                .from('dynamic_coupons')
                .insert({
                    user_id: userId,
                    reward_id: rewardId,
                    token_auth: token,
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single();

            if (insertError) {
                // If table doesn't exist yet, generate a local-only coupon
                const localCoupon: DynamicCoupon = {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    reward_id: rewardId,
                    token_auth: token,
                    created_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    is_used: false,
                };
                setCoupon(localCoupon);
            } else {
                setCoupon(data);
            }

            setSecondsLeft(COUPON_LIFETIME_SECONDS);
        } catch {
            setError('Error al generar el cupón. Intenta de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    }, [userId, rewardId]);

    // ------------------------------------------
    // Countdown timer
    // ------------------------------------------
    useEffect(() => {
        if (!coupon || isExpired) return;

        intervalRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    setIsExpired(true);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [coupon, isExpired]);

    // ------------------------------------------
    // Auto-generate on mount
    // ------------------------------------------
    useEffect(() => {
        generateCoupon();
    }, [generateCoupon]);

    // ------------------------------------------
    // Progress for the circular timer
    // ------------------------------------------
    const progress = secondsLeft / COUPON_LIFETIME_SECONDS;
    const circumference = 2 * Math.PI * 54; // r=54
    const strokeDashoffset = circumference * (1 - progress);

    // Color transitions based on time remaining
    const timerColor =
        secondsLeft > 120 ? '#00a859' : secondsLeft > 60 ? '#f59e0b' : '#ef4444';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in">
                {/* Header Gradient */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 pb-4 text-center">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                                EcoScan UGB Store
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>

                    <h2 className="text-lg font-bold text-white mb-1">{rewardLabel}</h2>
                    <p className="text-[#00a859] text-3xl font-black">
                        {discountPercent}% OFF
                    </p>
                </div>

                {/* QR Section */}
                <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-6 py-8 flex flex-col items-center">
                    {error ? (
                        <div className="text-center py-8">
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                            <button
                                onClick={generateCoupon}
                                className="px-6 py-2.5 rounded-full bg-[#00a859] text-white text-sm font-semibold hover:bg-[#00944e] transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : isGenerating ? (
                        <div className="py-12 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#00a859]/30 border-t-[#00a859] rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Generando cupón seguro...</p>
                        </div>
                    ) : coupon ? (
                        <>
                            {/* QR Code with expiration overlay */}
                            <div className="relative mb-6">
                                <div
                                    className={`p-4 bg-white rounded-2xl shadow-lg shadow-[#00a859]/10 transition-all duration-700 ${
                                        isExpired ? 'blur-sm opacity-30 scale-95' : ''
                                    }`}
                                >
                                    <QRCodeSVG
                                        value={JSON.stringify({
                                            token: coupon.token_auth,
                                            reward: rewardId,
                                            expires: coupon.expires_at,
                                            app: 'ecoscan-ugb',
                                        })}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="#ffffff"
                                        fgColor="#111827"
                                        imageSettings={{
                                            src: '',
                                            height: 0,
                                            width: 0,
                                            excavate: false,
                                        }}
                                    />
                                </div>

                                {/* Expired overlay */}
                                {isExpired && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="bg-red-500/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
                                            <p className="text-white font-bold text-sm">
                                                ⏰ Código Expirado
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Circular Timer */}
                            {!isExpired && (
                                <div className="relative w-28 h-28 mb-4">
                                    <svg
                                        className="w-full h-full -rotate-90"
                                        viewBox="0 0 120 120"
                                    >
                                        {/* Background ring */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            fill="none"
                                            stroke="#1f2937"
                                            strokeWidth="6"
                                        />
                                        {/* Progress ring */}
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            fill="none"
                                            stroke={timerColor}
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span
                                            className="text-2xl font-mono font-bold transition-colors duration-500"
                                            style={{ color: timerColor }}
                                        >
                                            {formatTime(secondsLeft)}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                            restante
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Token display */}
                            <div className="w-full bg-gray-800/60 rounded-xl p-3 mb-4 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 text-center">
                                    Token de Verificación
                                </p>
                                <p className="text-xs font-mono text-[#00a859] text-center break-all leading-relaxed">
                                    {coupon.token_auth.slice(0, 8)}····{coupon.token_auth.slice(-8)}
                                </p>
                            </div>

                            {/* Regenerate button (visible when expired) */}
                            {isExpired && (
                                <button
                                    onClick={generateCoupon}
                                    disabled={isGenerating}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00a859] to-[#00c96b] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#00a859]/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">🔄</span>
                                    Regenerar Código
                                </button>
                            )}

                            {/* Instructions */}
                            {!isExpired && (
                                <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                                    Muestra este código QR en el punto de venta de la UGB Store.
                                    <br />
                                    El cajero escaneará para validar tu descuento.
                                </p>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-950 px-6 py-3 flex items-center justify-between border-t border-gray-800">
                    <span className="text-[10px] text-gray-600">
                        ♻️ EcoScan AI — UGB {new Date().getFullYear()}
                    </span>
                    <span className="text-[10px] text-gray-600">
                        {isExpired ? '❌ Expirado' : '🔒 Cifrado E2E'}
                    </span>
                </div>
            </div>
        </div>
    );
}
