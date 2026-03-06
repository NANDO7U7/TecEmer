'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { supabase, BIN_INFO, COUPON_CATALOG } from '@/lib/supabase';
import type { RecyclingLog, UGBCoupon } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Accordion from '@/components/ui/Accordion';
import NotificationSettings from '@/components/NotificationSettings';

export default function DashboardPage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const [logs, setLogs] = useState<RecyclingLog[]>([]);
    const [coupons, setCoupons] = useState<UGBCoupon[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [redeemingId, setRedeemingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const [logsRes, couponsRes] = await Promise.all([
            supabase
                .from('recycling_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20),
            supabase
                .from('ugb_coupons')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }),
        ]);

        if (logsRes.data) setLogs(logsRes.data);
        if (couponsRes.data) setCoupons(couponsRes.data);
        setLoadingData(false);
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    // Redirect if not logged in
    if (!loading && !user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 px-4">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pt-4">
                    <div className="h-8 w-48 eco-skeleton rounded-lg" />
                    <div className="h-4 w-64 eco-skeleton rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="md:col-span-2 h-40 eco-skeleton rounded-2xl" />
                        <div className="h-40 eco-skeleton rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        <div className="h-24 eco-skeleton rounded-2xl" />
                        <div className="h-24 eco-skeleton rounded-2xl" />
                        <div className="h-24 eco-skeleton rounded-2xl" />
                    </div>
                </div>
            </main>
        );
    }

    const generateCoupon = async (catalogIndex: number) => {
        if (!user || !profile) return;

        const item = COUPON_CATALOG[catalogIndex];
        if (profile.eco_puntos < item.puntos_cost) return;

        setRedeemingId(catalogIndex);

        const code = `UGB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        await supabase.from('ugb_coupons').insert({
            user_id: user.id,
            code,
            description: item.description,
            discount_percent: item.discount_percent,
            puntos_cost: item.puntos_cost,
        });

        // Deduct points
        await supabase
            .from('profiles')
            .update({
                eco_puntos: profile.eco_puntos - item.puntos_cost,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        refreshProfile();
        fetchData();
        setRedeemingId(null);
    };

    // Compute stats
    const totalPlastico = logs.filter((l) => l.material === 'plastico').length;
    const totalLata = logs.filter((l) => l.material === 'lata').length;
    const totalComun = logs.filter((l) => l.material === 'comun').length;

    const materialBadge: Record<string, string> = {
        plastico: 'bg-green-100 text-green-700',
        lata: 'bg-amber-100 text-amber-700',
        comun: 'bg-gray-100 text-gray-700',
    };

    const materialLabel: Record<string, string> = {
        plastico: '🟢 Plástico',
        lata: '🟡 Lata',
        comun: '⚫ Común',
    };

    // Accordion items for coupon history
    const couponAccordionItems = coupons.map((c) => ({
        id: c.id,
        title: `${c.is_redeemed ? '✅' : '🎟️'} ${c.description}`,
        content: (
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Código:</span>
                    <span className="font-mono font-bold text-eco-green-dark">{c.code}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Descuento:</span>
                    <span className="font-semibold">{c.discount_percent}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Canjeado por:</span>
                    <span>{c.puntos_cost} puntos</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Estado:</span>
                    <span className={c.is_redeemed ? 'text-gray-400' : 'text-green-600 font-medium'}>
                        {c.is_redeemed ? 'Usado' : 'Disponible'}
                    </span>
                </div>
            </div>
        ),
    }));

    return (
        <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 pb-8 sm:pb-16 px-3 sm:px-4 safe-bottom">
            <div className="max-w-6xl mx-auto page-enter">
                {/* Header */}
                <div className="mb-5 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-eco-green-dark mb-1">
                        ¡Hola, {profile?.full_name || user?.email?.split('@')[0]}! 👋
                    </h1>
                    <p className="text-sm sm:text-base text-eco-gray">Tu panel de reciclaje EcoScan AI UGB</p>
                </div>

                {/* Top Row — Eco Points + Quick Scan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-8">
                    {/* Eco Points — Glassmorphism */}
                    <div className="md:col-span-2 rounded-2xl overflow-hidden">
                        <div className="eco-gradient p-6 sm:p-8 text-white relative overflow-hidden">
                            {/* Glass decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium opacity-80 mb-1">Saldo de Eco-Puntos</p>
                                    <p className="text-4xl sm:text-5xl font-bold animate-count-up">
                                        {profile?.eco_puntos || 0} ⭐
                                    </p>
                                    <p className="text-xs sm:text-sm opacity-70 mt-2">
                                        {profile?.total_scans || 0} escaneos realizados
                                    </p>
                                </div>
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl sm:text-5xl">
                                    ♻️
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Scan Button */}
                    <Card glass className="flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 eco-gradient rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg shadow-eco-green/20">
                            📷
                        </div>
                        <h3 className="font-bold text-eco-green-dark mb-1 sm:mb-2">Escanear ahora</h3>
                        <p className="text-xs text-eco-gray mb-3 sm:mb-4">Clasifica un residuo</p>
                        <Link href="/scan">
                            <Button variant="primary" size="md">
                                Ir al Escáner
                            </Button>
                        </Link>
                    </Card>
                </div>

                {/* Stats Row — Responsive 3-col */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-8">
                    <Card glass className="text-center !p-3 sm:!p-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg mx-auto mb-1 sm:mb-2 shadow-sm">🟢</div>
                        <p className="text-xl sm:text-2xl font-bold text-eco-green-dark animate-count-up">{totalPlastico}</p>
                        <p className="text-[10px] sm:text-xs text-eco-gray">Plásticos</p>
                    </Card>
                    <Card glass className="text-center !p-3 sm:!p-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg mx-auto mb-1 sm:mb-2 shadow-sm">🟡</div>
                        <p className="text-xl sm:text-2xl font-bold text-eco-green-dark animate-count-up">{totalLata}</p>
                        <p className="text-[10px] sm:text-xs text-eco-gray">Latas</p>
                    </Card>
                    <Card glass className="text-center !p-3 sm:!p-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg mx-auto mb-1 sm:mb-2 shadow-sm">⚫</div>
                        <p className="text-xl sm:text-2xl font-bold text-eco-green-dark animate-count-up">{totalComun}</p>
                        <p className="text-[10px] sm:text-xs text-eco-gray">Común</p>
                    </Card>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Recycling History */}
                    <Card>
                        <h3 className="font-semibold text-eco-green-dark mb-4">Historial de Reciclaje</h3>
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-eco-gray">
                                <div className="text-4xl mb-2">📋</div>
                                <p className="text-sm">Aún no tienes escaneos. ¡Empieza a reciclar!</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-eco-cream/50 hover:bg-eco-cream transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {log.material === 'plastico' ? '🟢' : log.material === 'lata' ? '🟡' : '⚫'}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium text-eco-green-dark">
                                                    {BIN_INFO[log.material]?.label || log.material}
                                                </p>
                                                <p className="text-xs text-eco-gray">
                                                    {new Date(log.created_at).toLocaleDateString('es', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${materialBadge[log.material]}`}>
                                                {materialLabel[log.material]}
                                            </span>
                                            <span className="text-xs font-bold text-eco-green-dark">
                                                +{log.puntos_ganados} ⭐
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* UGB Store */}
                    <div className="space-y-6">
                        {/* Coupon Store */}
                        <Card>
                            <h3 className="font-semibold text-eco-green-dark mb-4">🏪 UGB Store — Canjear Puntos</h3>
                            <div className="space-y-3">
                                {COUPON_CATALOG.map((item, i) => {
                                    const canAfford = (profile?.eco_puntos || 0) >= item.puntos_cost;
                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${canAfford ? 'border-eco-green/20 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'
                                                }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-eco-green-dark">{item.description}</p>
                                                <p className="text-xs text-eco-gray">{item.puntos_cost} eco-puntos</p>
                                            </div>
                                            <Button
                                                onClick={() => generateCoupon(i)}
                                                variant={canAfford ? 'primary' : 'ghost'}
                                                size="sm"
                                                disabled={!canAfford || redeemingId === i}
                                                isLoading={redeemingId === i}
                                            >
                                                {canAfford ? 'Canjear' : '🔒'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* My Coupons */}
                        {coupons.length > 0 && (
                            <Card padding="none" hover={false} className="p-6">
                                <h3 className="font-semibold text-eco-green-dark mb-4">🎟️ Mis Cupones</h3>
                                <Accordion items={couponAccordionItems} />
                            </Card>
                        )}
                        {/* Notification Settings */}
                        <NotificationSettings />
                    </div>
                </div>
            </div>
        </main>
    );
}
