'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import type { Profile, UGBCoupon } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Html5Qrcode } from 'html5-qrcode';

interface RecentValidation {
    code: string;
    description: string;
    studentName: string;
    studentCarnet: string;
    validatedAt: string;
}

export default function StoreAdminPage() {
    const { user, profile, loading } = useAuth();
    
    // Scanner and Coupon state
    const [isScanning, setIsScanning] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [loadingCoupon, setLoadingCoupon] = useState(false);
    
    const [activeCoupon, setActiveCoupon] = useState<UGBCoupon | null>(null);
    const [couponOwner, setCouponOwner] = useState<Profile | null>(null);
    
    // Logs and messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [recentRedemptions, setRecentRedemptions] = useState<RecentValidation[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Access control: Only admins can access store cashier validation
    useEffect(() => {
        if (!loading && !user) {
            window.location.href = '/login';
        } else if (!loading && user && profile && !profile.is_admin) {
            window.location.href = '/dashboard';
        }
    }, [user, profile, loading]);

    // QR Scanner lifecycle
    useEffect(() => {
        let qrScanner: Html5Qrcode | null = null;
        
        if (isScanning) {
            const timer = setTimeout(() => {
                try {
                    qrScanner = new Html5Qrcode("caja-qr-reader");
                    qrScanner.start(
                        { facingMode: "environment" },
                        {
                            fps: 12,
                            qrbox: { width: 220, height: 220 },
                        },
                        (decodedText) => {
                            setCouponCode(decodedText);
                            handleSearchCoupon(decodedText);
                            // Stop scanner after detection
                            setIsScanning(false);
                            if (qrScanner) {
                                qrScanner.stop().catch(err => console.error("Error stopping store scanner", err));
                            }
                        },
                        () => {
                            // Suppress frame decoding errors
                        }
                    ).catch(err => {
                        console.error("Error starting store scanner camera", err);
                        setErrorMessage("No se pudo iniciar la cámara. Verifica los permisos de la webcam.");
                        setIsScanning(false);
                    });
                } catch (err) {
                    console.error("Html5Qrcode constructor error", err);
                    setIsScanning(false);
                }
            }, 250);

            return () => {
                clearTimeout(timer);
                if (qrScanner && qrScanner.isScanning) {
                    qrScanner.stop().catch(err => console.error("Error stopping store scanner in cleanup", err));
                }
            };
        }
    }, [isScanning]);

    // Fetch and check coupon status
    const handleSearchCoupon = async (codeText: string) => {
        const cleanCode = codeText.trim();
        if (!cleanCode) return;

        setLoadingCoupon(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setActiveCoupon(null);
        setCouponOwner(null);

        try {
            const { data: coupon, error: couponError } = await supabase
                .from('ugb_coupons')
                .select('*')
                .eq('code', cleanCode)
                .single();

            if (couponError || !coupon) {
                setErrorMessage(`El cupón "${cleanCode}" no fue encontrado en el sistema.`);
                setLoadingCoupon(false);
                return;
            }

            setActiveCoupon(coupon);

            // Fetch student profile details
            const { data: student, error: studentError } = await supabase
                .from('profiles')
                .select('id, name, full_name, carnet')
                .eq('id', coupon.user_id)
                .single();

            if (!studentError && student) {
                setCouponOwner({
                    ...student,
                    full_name: student.name || student.full_name
                } as Profile);
            }
        } catch (err: any) {
            setErrorMessage('Error al consultar el cupón: ' + err.message);
        } finally {
            setLoadingCoupon(false);
        }
    };

    // Confirm and Redeem the coupon
    const handleRedeemCoupon = async () => {
        if (!activeCoupon) return;

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const { error: updateError } = await supabase
                .from('ugb_coupons')
                .update({
                    is_redeemed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeCoupon.id);

            if (updateError) throw updateError;

            // Success state
            const valRecord: RecentValidation = {
                code: activeCoupon.code,
                description: activeCoupon.description,
                studentName: couponOwner?.name || couponOwner?.full_name || 'Estudiante UGB',
                studentCarnet: couponOwner?.carnet || 'S/C',
                validatedAt: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };

            setRecentRedemptions(prev => [valRecord, ...prev].slice(0, 10));
            setSuccessMessage(`¡Cupón ${activeCoupon.code} validado y canjeado con éxito!`);
            
            // Clear current selection
            setActiveCoupon(null);
            setCouponOwner(null);
            setCouponCode('');

            // Hide success banner after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 4000);

        } catch (err: any) {
            setErrorMessage('No se pudo validar el cupón: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !profile || !profile.is_admin) {
        return (
            <main className="min-h-screen bg-eco-cream pt-20 px-4 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-green mx-auto" />
                    <p className="text-eco-green-dark font-medium">Verificando permisos de caja...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 page-enter">
                
                {/* Header Card */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <div className="eco-gradient p-6 sm:p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="text-[10px] sm:text-xs font-bold uppercase bg-white/20 text-white px-2.5 py-1 rounded-full tracking-wider">
                                    Punto de Venta · UGB Store
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight">
                                    Caja Registradora · Canje QR
                                </h1>
                                <p className="text-sm text-white/80 mt-1 max-w-2xl">
                                    Escanea códigos QR de los cupones de los estudiantes para aplicar descuentos de manera automática y segura.
                                </p>
                            </div>
                            <Link href="/admin">
                                <Button variant="secondary" size="sm" className="whitespace-nowrap bg-white/10 text-white border-white/20 hover:bg-white/20">
                                    ⚙️ Ir a Panel General
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Scanner & Manual Search Column */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        <Card glass className="flex flex-col items-center p-6 text-center space-y-6">
                            <div className="w-full text-left">
                                <h2 className="text-lg font-bold text-eco-green-dark">Lector QR de Caja</h2>
                                <p className="text-xs text-eco-gray mt-0.5">Activa la cámara para iniciar el escaneo de los cupones</p>
                            </div>

                            {/* Viewfinder area */}
                            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-square w-full max-w-[280px] border border-gray-200 shadow-md">
                                {isScanning ? (
                                    <div id="caja-qr-reader" className="w-full h-full object-cover"></div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 bg-gray-950 p-6 space-y-3">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">
                                            📷
                                        </div>
                                        <p className="text-xs text-center font-medium">La cámara está desactivada</p>
                                    </div>
                                )}

                                {/* Camera scanner overlays */}
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-[85%] h-[85%] border border-white/20 rounded-xl relative">
                                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-eco-emerald" />
                                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-eco-emerald" />
                                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-eco-emerald" />
                                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-eco-emerald" />
                                            <div className="scan-line" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Camera Action Buttons */}
                            <div className="flex gap-3 w-full max-w-sm">
                                <Button
                                    onClick={() => setIsScanning(prev => !prev)}
                                    variant={isScanning ? 'ghost' : 'primary'}
                                    size="lg"
                                    className="flex-1"
                                >
                                    {isScanning ? '🛑 Detener Cámara' : '🔌 Activar Escáner'}
                                </Button>
                            </div>

                            <div className="w-full border-t border-gray-100 my-4 pt-4 text-left">
                                <label htmlFor="manual-code" className="block text-xs font-bold text-eco-gray uppercase tracking-wider mb-2">
                                    Buscador manual (Código de Cupón)
                                </label>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSearchCoupon(couponCode);
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        id="manual-code"
                                        type="text"
                                        placeholder="Ej: UGB-COFFEE-15"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 px-4 py-2 text-sm bg-eco-cream/50 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green focus:ring-2 focus:ring-eco-green/15 font-mono uppercase transition-all"
                                    />
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={loadingCoupon || !couponCode.trim()}
                                        isLoading={loadingCoupon}
                                    >
                                        Buscar
                                    </Button>
                                </form>
                            </div>
                        </Card>

                        {/* Success / Error Alerts */}
                        {successMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                                <span className="text-xl">🎉</span>
                                <div>
                                    <p className="text-sm font-bold">¡Canje Exitoso!</p>
                                    <p className="text-xs text-emerald-700/90 mt-0.5">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="text-sm font-bold">Cupón Inválido</p>
                                    <p className="text-xs text-red-700/90 mt-0.5">{errorMessage}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Validation Panel Column */}
                    <div className="space-y-6">
                        
                        {/* Selected Coupon Details */}
                        <Card className="p-6">
                            <h3 className="font-bold text-eco-green-dark text-base mb-4 flex items-center gap-2">
                                🎟️ Detalle de Validación
                            </h3>

                            {loadingCoupon ? (
                                <div className="py-12 text-center space-y-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eco-green mx-auto" />
                                    <p className="text-xs text-eco-gray">Consultando cupón en base de datos...</p>
                                </div>
                            ) : activeCoupon ? (
                                <div className="space-y-5">
                                    {/* Status Badge */}
                                    <div className="text-center">
                                        {activeCoupon.is_redeemed ? (
                                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-red-50 text-red-700 text-sm font-bold border border-red-100">
                                                ❌ CANJEADO ANTERIORMENTE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-green-50 text-green-700 text-sm font-bold border border-green-100 animate-pulse">
                                                ✅ DISPONIBLE PARA CANJE
                                            </span>
                                        )}
                                    </div>

                                    {/* Student details */}
                                    <div className="bg-eco-cream/40 border border-gray-100 rounded-xl p-4 space-y-2.5">
                                        <h4 className="text-xs font-bold text-eco-gray uppercase tracking-wider">Estudiante Beneficiario</h4>
                                        <div className="text-sm">
                                            <p className="font-bold text-eco-green-dark">{couponOwner?.name || couponOwner?.full_name || 'Estudiante UGB'}</p>
                                            <p className="text-xs font-mono text-eco-gray mt-0.5">Carnet: {couponOwner?.carnet || 'S/C'}</p>
                                        </div>
                                    </div>

                                    {/* Coupon benefits */}
                                    <div className="space-y-2.5">
                                        <h4 className="text-xs font-bold text-eco-gray uppercase tracking-wider">Detalles del Descuento</h4>
                                        <div className="text-sm space-y-1.5">
                                            <div className="flex justify-between pb-1 border-b border-gray-50">
                                                <span className="text-gray-400">Código:</span>
                                                <span className="font-mono font-bold text-eco-green-dark">{activeCoupon.code}</span>
                                            </div>
                                            <div className="flex justify-between pb-1 border-b border-gray-50">
                                                <span className="text-gray-400">Beneficio:</span>
                                                <span className="font-medium text-eco-green-dark">{activeCoupon.description}</span>
                                            </div>
                                            <div className="flex justify-between pb-1 border-b border-gray-50">
                                                <span className="text-gray-400">Descuento:</span>
                                                <span className="font-bold text-eco-green">{activeCoupon.discount_percent}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Costo Puntos:</span>
                                                <span className="font-medium text-gray-500">{activeCoupon.puntos_cost} ⭐</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit action */}
                                    <Button
                                        onClick={handleRedeemCoupon}
                                        variant="primary"
                                        size="lg"
                                        className="w-full shadow-lg shadow-eco-green/10"
                                        disabled={activeCoupon.is_redeemed || isSaving}
                                        isLoading={isSaving}
                                    >
                                        🎟️ Confirmar y Canjear Descuento
                                    </Button>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-eco-gray border-2 border-dashed border-gray-100 rounded-2xl">
                                    <span className="text-3xl">📭</span>
                                    <p className="text-xs mt-2 font-medium">Ningún cupón seleccionado</p>
                                    <p className="text-[10px] text-gray-400 mt-1 max-w-[180px] mx-auto">Escanea un código QR o búscalo manualmente en el panel izquierdo.</p>
                                </div>
                            )}
                        </Card>

                        {/* Recent Validations Feed */}
                        <Card className="p-5">
                            <h3 className="font-semibold text-eco-green-dark text-sm mb-3">
                                📋 Validaciones de este Turno
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {recentRedemptions.length === 0 ? (
                                    <p className="text-xs text-eco-gray text-center py-6">No se han realizado validaciones en esta sesión.</p>
                                ) : (
                                    recentRedemptions.map((item, idx) => (
                                        <div key={idx} className="bg-eco-cream/50 rounded-xl p-3 border border-gray-100 flex justify-between items-start text-xs hover:bg-eco-cream transition-colors">
                                            <div className="space-y-0.5">
                                                <p className="font-mono font-bold text-eco-green-dark">{item.code}</p>
                                                <p className="text-eco-gray leading-tight">{item.description}</p>
                                                <p className="text-[10px] text-gray-400 font-semibold">{item.studentName} ({item.studentCarnet})</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 font-semibold bg-white border border-gray-200 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                                {item.validatedAt}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
