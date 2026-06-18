'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { supabase, BIN_INFO, COUPON_CATALOG } from '@/lib/supabase';
import type { RecyclingLog, UGBCoupon, WeightPointsConfig } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Accordion from '@/components/ui/Accordion';
import NotificationSettings from '@/components/NotificationSettings';
import Leaderboard from '@/components/Leaderboard';
import BadgeDisplay from '@/components/BadgeDisplay';
import ImpactStats from '@/components/ImpactStats';
import RewardQR from '@/components/RewardQR';
import P2PTransferForm from '@/components/P2PTransferForm';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams } from 'next/navigation';

interface Faculty {
    id: string;
    name: string;
    emoji: string;
}

function DashboardContent() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const searchParams = useSearchParams();
    const [logs, setLogs] = useState<RecyclingLog[]>([]);
    const [coupons, setCoupons] = useState<UGBCoupon[]>([]);
    const [weightConfigs, setWeightConfigs] = useState<WeightPointsConfig[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [redeemingId, setRedeemingId] = useState<number | null>(null);
    const [activeQR, setActiveQR] = useState<{
        rewardId: string;
        label: string;
        discount: number;
    } | null>(null);
    const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(null);
    const [selectedCouponDesc, setSelectedCouponDesc] = useState<string | null>(null);

    // Profile editing states (B8)
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCarnet, setEditCarnet] = useState('');
    const [editFacultyId, setEditFacultyId] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Fetch faculties on mount
    useEffect(() => {
        async function loadFaculties() {
            try {
                const { data } = await supabase
                    .from('faculties')
                    .select('id, name, emoji')
                    .order('name', { ascending: true });
                if (data) setFaculties(data);
            } catch (err) {
                console.error('Error cargando facultades:', err);
            }
        }
        loadFaculties();
    }, []);

    // Auto open edit modal if ?edit=true parameter is present in URL
    useEffect(() => {
        if (!loading && user && profile && searchParams.get('edit') === 'true') {
            setEditName(profile?.name || profile?.full_name || '');
            setEditCarnet(profile?.carnet || profile?.carnet_code || '');
            setEditFacultyId(profile?.faculty_id || '');
            setProfileError('');
            setProfileSuccess(false);
            setIsEditingProfile(true);
        }
    }, [searchParams, loading, user, profile]);

    const startEditing = () => {
        setEditName(profile?.name || profile?.full_name || '');
        setEditCarnet(profile?.carnet || profile?.carnet_code || '');
        setEditFacultyId(profile?.faculty_id || '');
        setProfileError('');
        setProfileSuccess(false);
        setIsEditingProfile(true);
    };

    const closeEditModal = () => {
        setIsEditingProfile(false);
        setProfileError('');
        setProfileSuccess(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/dashboard');
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess(false);

        // Validate carnet UGB pattern
        const carnetClean = editCarnet.toUpperCase().replace(/\s/g, '');
        const carnetRegex = /^[A-Z]{2,5}\d{4,8}$/;
        if (carnetClean && !carnetRegex.test(carnetClean)) {
            setProfileError('Formato de carnet no válido. Ej: SMIS098722');
            setSavingProfile(false);
            return;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                name: editName.trim(),
                carnet: carnetClean || null,
                faculty_id: editFacultyId || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            setProfileError('Error al actualizar perfil: ' + updateError.message);
        } else {
            setProfileSuccess(true);
            refreshProfile();
            setTimeout(() => {
                closeEditModal();
            }, 1200);
        }
        setSavingProfile(false);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const [logsRes, couponsRes, configRes] = await Promise.all([
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
            supabase
                .from('weight_points_config')
                .select('*'),
        ]);

        if (logsRes.data) setLogs(logsRes.data);
        if (couponsRes.data) setCoupons(couponsRes.data);
        if (configRes.data) setWeightConfigs(configRes.data);
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

        // Open the QR modal with the dynamic coupon
        setActiveQR({
            rewardId: item.id,
            label: item.description,
            discount: item.discount_percent,
        });
    };

    // Compute stats
    const totalPlastico = logs.filter((l) => l.material === 'plastico').reduce((acc, l) => acc + (l.cantidad || 1), 0);
    const totalLata = logs.filter((l) => l.material === 'lata').reduce((acc, l) => acc + (l.cantidad || 1), 0);
    const totalComun = logs.filter((l) => l.material === 'comun').reduce((acc, l) => acc + (l.cantidad || 1), 0);

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
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Acción:</span>
                    {!c.is_redeemed ? (
                        <button
                            onClick={() => {
                                setSelectedCouponCode(c.code);
                                setSelectedCouponDesc(c.description);
                            }}
                            className="bg-eco-green text-white text-xs font-semibold px-3 py-1 rounded-lg hover:bg-eco-green-dark transition-colors"
                        >
                            📱 Mostrar QR
                        </button>
                    ) : (
                        <span className="text-xs text-gray-400">Sin acciones</span>
                    )}
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
                        ¡Hola, {profile?.name || profile?.full_name || user?.email?.split('@')[0]}! 👋
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
                                                    {log.peso ? ` (${log.peso} ${log.unidad_peso})` : (log.cantidad && log.cantidad > 1 && ` (x${log.cantidad})`)}
                                                </p>
                                                {log.tipo_detalle && (
                                                    <p className="text-[11px] text-gray-500 font-semibold mb-0.5 leading-none">
                                                        Detalle: {log.tipo_detalle}
                                                    </p>
                                                )}
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
                        {/* Reglas de Eco-Puntos */}
                        <Card glass className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 border border-green-200/40">
                            <h4 className="font-bold text-eco-green-dark text-sm mb-2 flex items-center gap-1.5">
                                💡 Reglas de Eco-Puntos
                            </h4>
                            <ul className="space-y-2 text-xs text-eco-green-dark/85">
                                <li className="flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span>🟢 Plásticos (PET):</span>
                                        <span className="font-bold text-eco-green">+15 Puntos ⭐ / unid</span>
                                    </div>
                                    {(() => {
                                        const config = weightConfigs.find(c => c.material === 'plastico');
                                        return config && (
                                            <span className="text-[10px] text-eco-green-dark/70">
                                                ⚖️ Por Peso: +{config.points_per_kg} pts/kg | +{config.points_per_lb} pts/lb
                                            </span>
                                        );
                                    })()}
                                </li>
                                <li className="flex flex-col gap-0.5 border-t border-green-200/20 pt-1.5">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span>🟡 Latas (Aluminio):</span>
                                        <span className="font-bold text-amber-600">+20 Puntos ⭐ / unid</span>
                                    </div>
                                    {(() => {
                                        const config = weightConfigs.find(c => c.material === 'lata');
                                        return config && (
                                            <span className="text-[10px] text-eco-green-dark/70">
                                                ⚖️ Por Peso: +{config.points_per_kg} pts/kg | +{config.points_per_lb} pts/lb
                                            </span>
                                        );
                                    })()}
                                </li>
                                <li className="flex flex-col gap-0.5 border-t border-green-200/20 pt-1.5">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span>⚫ Común (Negro):</span>
                                        <span className="font-bold text-gray-500">0 Puntos (Descarte)</span>
                                    </div>
                                </li>
                            </ul>
                        </Card>

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

                        {/* P2P Transfer */}
                        {user && (
                            <P2PTransferForm
                                userId={user.id}
                                userBalance={profile?.eco_puntos || 0}
                                onTransferComplete={refreshProfile}
                            />
                        )}

                        {/* Perfil del Estudiante (B8) */}
                        <Card className="p-5">
                            <h3 className="font-semibold text-eco-green-dark mb-3 flex items-center gap-2">
                                👤 Datos del Estudiante
                            </h3>
                            <div className="space-y-2 text-sm text-eco-gray">
                                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-400">Nombre:</span>
                                    <span className="font-medium text-eco-green-dark text-right truncate max-w-[180px]">{profile?.name || profile?.full_name || 'No configurado'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-400">Carnet:</span>
                                    <span className="font-mono font-medium text-eco-green-dark text-right">{profile?.carnet || 'No configurado'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-400">Facultad:</span>
                                    <span className="font-medium text-eco-green-dark text-right truncate max-w-[180px]">
                                        {profile?.faculty_id ? (
                                            faculties.find(f => f.id === profile.faculty_id)
                                                ? `${faculties.find(f => f.id === profile.faculty_id)?.emoji} ${faculties.find(f => f.id === profile.faculty_id)?.name}`
                                                : 'Cargando...'
                                        ) : 'Sin Facultad'}
                                    </span>
                                </div>
                                <Button
                                    onClick={startEditing}
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                >
                                    ✏️ Editar Perfil
                                </Button>
                            </div>
                        </Card>

                        {/* Notification Settings */}
                        <NotificationSettings />
                    </div>
                </div>

                {/* Row 3 — Leaderboard + Badges */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-5 sm:mt-8">
                    <Leaderboard />
                    <BadgeDisplay
                        userId={user?.id}
                        ecoPuntos={profile?.eco_puntos || 0}
                        totalScans={profile?.total_scans || 0}
                    />
                </div>

                {/* Row 4 — Environmental Impact */}
                <div className="mt-5 sm:mt-8">
                    <ImpactStats userId={user?.id} />
                </div>

                {/* QR Modal */}
                {activeQR && user && (
                    <RewardQR
                        userId={user.id}
                        rewardId={activeQR.rewardId}
                        rewardLabel={activeQR.label}
                        discountPercent={activeQR.discount}
                        onClose={() => setActiveQR(null)}
                    />
                )}

                {/* Modal de QR de Cupón Adquirido (Mostrar QR) */}
                {selectedCouponCode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in text-center p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs text-eco-green font-bold uppercase tracking-wider">Cupón EcoScan UGB</span>
                                <button
                                    onClick={() => { setSelectedCouponCode(null); setSelectedCouponDesc(null); }}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <h3 className="font-bold text-eco-green-dark text-base mb-3">{selectedCouponDesc}</h3>
                            
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 inline-block mx-auto mb-4 shadow-sm">
                                <QRCodeSVG
                                    value={selectedCouponCode}
                                    size={180}
                                    level="M"
                                    fgColor="#111827"
                                    bgColor="#ffffff"
                                />
                            </div>

                            <div className="bg-eco-cream/50 rounded-xl p-3 mb-4">
                                <p className="text-[10px] text-eco-gray uppercase tracking-widest font-semibold">Código del Cupón</p>
                                <p className="text-base font-mono font-bold text-eco-green-dark mt-0.5">{selectedCouponCode}</p>
                            </div>

                            <p className="text-xs text-eco-gray">
                                Presenta este código QR en el establecimiento correspondiente. El cajero lo escaneará para aplicar tu descuento.
                            </p>
                        </div>
                    </div>
                )}

                {/* Modal de Editar Perfil (B8) */}
                {isEditingProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
                            <div className="eco-gradient p-5 text-white flex justify-between items-center">
                                <h3 className="font-bold text-lg">✏️ Editar Perfil</h3>
                                <button
                                    onClick={closeEditModal}
                                    className="text-white hover:text-gray-200 transition-colors w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="edit-name" className="block text-xs font-semibold text-eco-gray uppercase mb-1">
                                        Nombre Completo
                                    </label>
                                    <input
                                        id="edit-name"
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all text-sm font-medium text-eco-green-dark"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-carnet" className="block text-xs font-semibold text-eco-gray uppercase mb-1">
                                        Código de Carnet UGB
                                    </label>
                                    <input
                                        id="edit-carnet"
                                        type="text"
                                        value={editCarnet}
                                        onChange={(e) => setEditCarnet(e.target.value)}
                                        placeholder="SMIS098722"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all text-sm font-mono tracking-wider uppercase text-eco-green-dark"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-faculty" className="block text-xs font-semibold text-eco-gray uppercase mb-1">
                                        Facultad UGB
                                    </label>
                                    <select
                                        id="edit-faculty"
                                        value={editFacultyId}
                                        onChange={(e) => setEditFacultyId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all text-sm bg-white text-eco-green-dark font-medium"
                                    >
                                        <option value="">-- Sin Facultad --</option>
                                        {faculties.map((fac) => (
                                            <option key={fac.id} value={fac.id}>
                                                {fac.emoji} {fac.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {profileError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100">
                                        {profileError}
                                    </div>
                                )}

                                {profileSuccess && (
                                    <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs border border-green-100 font-semibold text-center animate-pulse">
                                        ¡Perfil actualizado con éxito!
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        className="flex-1"
                                        isLoading={savingProfile}
                                    >
                                        Guardar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={closeEditModal}
                                        variant="ghost"
                                        size="md"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function DashboardPage() {
    return (
        <React.Suspense fallback={
            <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 px-4">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pt-4">
                    <div className="h-8 w-48 eco-skeleton rounded-lg animate-pulse" />
                    <div className="h-4 w-64 eco-skeleton rounded-lg animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="md:col-span-2 h-40 eco-skeleton rounded-2xl animate-pulse" />
                        <div className="h-40 eco-skeleton rounded-2xl animate-pulse" />
                    </div>
                </div>
            </main>
        }>
            <DashboardContent />
        </React.Suspense>
    );
}
