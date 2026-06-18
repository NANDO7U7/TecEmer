'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import type { Profile, RecyclingLog, UGBCoupon } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Html5Qrcode } from 'html5-qrcode';

interface Faculty {
    id: string;
    name: string;
    short_name: string;
    color: string;
    emoji: string;
}

export default function AdminPage() {
    const { user, profile, loading } = useAuth();
    
    // UI state
    const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'coupons' | 'manual' | 'config'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [couponSearch, setCouponSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isScanningQR, setIsScanningQR] = useState(false);

    // Manual register state
    const [manualUserQuery, setManualUserQuery] = useState('');
    const [manualSelectedUser, setManualSelectedUser] = useState<Profile | null>(null);
    const [manualMaterial, setManualMaterial] = useState<'plastico' | 'lata' | 'comun'>('plastico');
    const [manualSubtype, setManualSubtype] = useState('Botella PET pequeña (< 600ml)');
    const [manualOtroDetalle, setManualOtroDetalle] = useState('');
    const [manualCantidad, setManualCantidad] = useState<number | ''>(1);
    const [manualIsSaving, setManualIsSaving] = useState(false);

    // Weight config state
    const [weightConfigs, setWeightConfigs] = useState<{
        material: 'plastico' | 'lata' | 'comun';
        points_per_kg: number;
        points_per_lb: number;
    }[]>([
        { material: 'plastico', points_per_kg: 500, points_per_lb: 227 },
        { material: 'lata', points_per_kg: 1000, points_per_lb: 454 },
        { material: 'comun', points_per_kg: 0, points_per_lb: 0 }
    ]);
    const [configPlasticPerKg, setConfigPlasticPerKg] = useState<number>(500);
    const [configPlasticPerLb, setConfigPlasticPerLb] = useState<number>(227);
    const [configLataPerKg, setConfigLataPerKg] = useState<number>(1000);
    const [configLataPerLb, setConfigLataPerLb] = useState<number>(454);
    const [configComunPerKg, setConfigComunPerKg] = useState<number>(0);
    const [configComunPerLb, setConfigComunPerLb] = useState<number>(0);

    // Manual weight register state
    const [manualRegisterType, setManualRegisterType] = useState<'unit' | 'weight'>('unit');
    const [manualWeight, setManualWeight] = useState<number | ''>('');
    const [manualWeightUnit, setManualWeightUnit] = useState<'kg' | 'lb'>('kg');
    const [manualOverridePoints, setManualOverridePoints] = useState<number | ''>(0);

    // Auto-calculate points based on units or weight
    useEffect(() => {
        let calculated = 0;
        if (manualRegisterType === 'unit') {
            const pointsPerUnit = manualMaterial === 'plastico' ? 15 : manualMaterial === 'lata' ? 20 : 0;
            calculated = pointsPerUnit * (Number(manualCantidad) || 0);
        } else {
            const config = weightConfigs.find(c => c.material === manualMaterial);
            if (config) {
                const rate = manualWeightUnit === 'kg' ? config.points_per_kg : config.points_per_lb;
                calculated = Math.round(rate * (Number(manualWeight) || 0));
            }
        }
        setManualOverridePoints(calculated);
    }, [manualRegisterType, manualMaterial, manualCantidad, manualWeight, manualWeightUnit, weightConfigs]);

    // Sync default subtype when manual material changes
    useEffect(() => {
        if (manualMaterial === 'plastico') {
            setManualSubtype('Botella PET pequeña (< 600ml)');
        } else if (manualMaterial === 'lata') {
            setManualSubtype('Lata de Refresco/Bebida (Aluminio)');
        } else {
            setManualSubtype('Envolturas/Empaques de Snacks');
        }
        setManualOtroDetalle('');
    }, [manualMaterial]);

    // Initialize and clean up webcam scanner
    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;
        
        if (isScanningQR) {
            const timer = setTimeout(() => {
                html5QrCode = new Html5Qrcode("admin-qr-reader");
                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 220, height: 220 },
                    },
                    (decodedText) => {
                        setCouponSearch(decodedText);
                        setSuccessMessage(`Cupón detectado exitosamente: ${decodedText}`);
                        setIsScanningQR(false);
                        if (html5QrCode) {
                            html5QrCode.stop().catch(err => console.error("Error stopping scanner", err));
                        }
                    },
                    () => {
                        // ignore error frames
                    }
                ).catch(err => {
                    console.error("Error starting camera", err);
                    setErrorMessage("No se pudo iniciar la cámara. Verifica los permisos.");
                    setIsScanningQR(false);
                });
            }, 250);

            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(err => console.error("Error stopping scanner in cleanup", err));
                }
            };
        }
    }, [isScanningQR]);

    // Data state
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [recyclingLogs, setRecyclingLogs] = useState<(RecyclingLog & { profile_name?: string; profile_carnet?: string })[]>([]);
    const [coupons, setCoupons] = useState<(UGBCoupon & { profile_name?: string; profile_carnet?: string })[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Editing user modal state
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editPoints, setEditPoints] = useState<number>(0);
    const [editFaculty, setEditFaculty] = useState<string>('');
    const [editIsAdmin, setEditIsAdmin] = useState<boolean>(false);

    const handleAdminToggle = (checked: boolean) => {
        if (checked) {
            const confirmGrant = window.confirm("¿Deseas darle los permisos de admin a este estudiante?");
            if (confirmGrant) {
                setEditIsAdmin(true);
            }
        } else {
            // Prevent active admin from removing their own privileges
            if (editingUser?.id === user?.id) {
                alert("No puedes quitarte los permisos de administrador a ti mismo para evitar perder el acceso al panel.");
                return;
            }
            const confirmRevoke = window.confirm("¿Deseas quitarle los permisos de admin a este estudiante?");
            if (confirmRevoke) {
                setEditIsAdmin(false);
            }
        }
    };

    // Global Statistics
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPoints: 0,
        totalScans: 0,
        totalCO2: 0,
        materialStats: { plastico: 0, lata: 0, comun: 0 }
    });

    // Fetch all administrative data
    const fetchAdminData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        setErrorMessage(null);

        try {
            // 1. Fetch Faculties
            const { data: facs, error: facError } = await supabase
                .from('faculties')
                .select('*');
            if (facError) throw facError;
            setFaculties(facs || []);

            // 1b. Fetch Weight Points Config
            const { data: wConfigs, error: wError } = await supabase
                .from('weight_points_config')
                .select('*');
            if (wError) throw wError;
            if (wConfigs && wConfigs.length > 0) {
                setWeightConfigs(wConfigs);
                
                const plastic = wConfigs.find(c => c.material === 'plastico');
                if (plastic) {
                    setConfigPlasticPerKg(Number(plastic.points_per_kg));
                    setConfigPlasticPerLb(Number(plastic.points_per_lb));
                }
                
                const lata = wConfigs.find(c => c.material === 'lata');
                if (lata) {
                    setConfigLataPerKg(Number(lata.points_per_kg));
                    setConfigLataPerLb(Number(lata.points_per_lb));
                }
                
                const comun = wConfigs.find(c => c.material === 'comun');
                if (comun) {
                    setConfigComunPerKg(Number(comun.points_per_kg));
                    setConfigComunPerLb(Number(comun.points_per_lb));
                }
            }

            // 2. Fetch Profiles
            const { data: profs, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .order('name', { ascending: true });
            if (profError) throw profError;
            
            // Map name/full_name for compatibility
            const normalizedProfs = (profs || []).map(p => ({
                ...p,
                full_name: p.name || p.full_name // ensure both are set
            })) as Profile[];
            setProfiles(normalizedProfs);

            // 3. Fetch Recycling Logs (with profiles info)
            const { data: logsData, error: logsError } = await supabase
                .from('recycling_logs')
                .select('*')
                .order('created_at', { ascending: false });
            if (logsError) throw logsError;

            // Map user info to logs
            const mappedLogs = (logsData || []).map(log => {
                const userProf = normalizedProfs.find(p => p.id === log.user_id);
                return {
                    ...log,
                    profile_name: userProf?.name || 'Usuario desconocido',
                    profile_carnet: userProf?.carnet || 'S/C'
                };
            });
            setRecyclingLogs(mappedLogs);

            // 4. Fetch Coupons (with profiles info)
            const { data: couponsData, error: couponsError } = await supabase
                .from('ugb_coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (couponsError) throw couponsError;

            const mappedCoupons = (couponsData || []).map(c => {
                const userProf = normalizedProfs.find(p => p.id === c.user_id);
                return {
                    ...c,
                    profile_name: userProf?.name || 'Usuario desconocido',
                    profile_carnet: userProf?.carnet || 'S/C'
                };
            });
            setCoupons(mappedCoupons);

            // 5. Calculate statistics
            const totalUsers = normalizedProfs.length;
            const totalPoints = normalizedProfs.reduce((sum, p) => sum + (p.eco_puntos || 0), 0);
            const totalScans = mappedLogs.length;
            const totalCO2 = normalizedProfs.reduce((sum, p) => sum + (p.total_co2_saved || 0), 0);
            
            const materialStats = {
                plastico: mappedLogs.filter(l => l.material === 'plastico').reduce((sum, l) => sum + (l.cantidad || 1), 0),
                lata: mappedLogs.filter(l => l.material === 'lata').reduce((sum, l) => sum + (l.cantidad || 1), 0),
                comun: mappedLogs.filter(l => l.material === 'comun').reduce((sum, l) => sum + (l.cantidad || 1), 0),
            };

            setStats({ totalUsers, totalPoints, totalScans, totalCO2, materialStats });

        } catch (err: any) {
            console.error('Error cargando datos administrativos:', err);
            setErrorMessage('No se pudieron cargar los datos de administración: ' + err.message);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && profile?.is_admin) {
            fetchAdminData();
        }
    }, [user, profile, fetchAdminData]);

    // Access Control Redirect
    useEffect(() => {
        if (!loading && !user) {
            window.location.href = '/login';
        } else if (!loading && user && profile && !profile.is_admin) {
            window.location.href = '/dashboard';
        }
    }, [user, profile, loading]);

    // Save editing user profile (points/faculty/admin role)
    const handleSaveUserEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    eco_puntos: editPoints,
                    faculty_id: editFaculty || null,
                    is_admin: editIsAdmin,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingUser.id);

            if (updateError) throw updateError;

            setSuccessMessage(`Usuario ${editingUser.name || 'Estudiante'} actualizado correctamente.`);
            setEditingUser(null);
            fetchAdminData();
        } catch (err: any) {
            setErrorMessage('Error al actualizar el usuario: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Redeem coupon manually (cajero role)
    const handleRedeemCoupon = async (couponId: string) => {
        if (!confirm('¿Seguro que deseas marcar este cupón como canjeado?')) return;
        setIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const { error: redeemError } = await supabase
                .from('ugb_coupons')
                .update({
                    is_redeemed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', couponId);

            if (redeemError) throw redeemError;

            setSuccessMessage('El cupón ha sido canjeado y validado de manera exitosa.');
            fetchAdminData();
        } catch (err: any) {
            setErrorMessage('Error al canjear el cupón: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle manual waste registration and point assignment
    const handleManualRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualSelectedUser) {
            setErrorMessage('Por favor, selecciona un estudiante antes de registrar.');
            return;
        }

        let qty: number | null = null;
        let weightVal: number | null = null;
        let weightUnitVal: 'kg' | 'lb' | null = null;

        if (manualRegisterType === 'unit') {
            const parsedQty = Number(manualCantidad);
            if (isNaN(parsedQty) || parsedQty < 1) {
                setErrorMessage('La cantidad de residuos debe ser al menos 1.');
                return;
            }
            qty = parsedQty;
        } else {
            const parsedWeight = Number(manualWeight);
            if (isNaN(parsedWeight) || parsedWeight <= 0) {
                setErrorMessage('El peso de los residuos debe ser mayor a 0.');
                return;
            }
            weightVal = parsedWeight;
            weightUnitVal = manualWeightUnit;
        }

        const finalDetail = manualSubtype === 'otro' 
            ? (manualOtroDetalle.trim() || 'Otro específico') 
            : manualSubtype;

        // Points to award (either calculated or manually overridden)
        const totalPoints = Number(manualOverridePoints);
        if (isNaN(totalPoints) || totalPoints < 0) {
            setErrorMessage('Los puntos a asignar deben ser un número no negativo.');
            return;
        }

        setManualIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            // Determine CO2 to add:
            let co2ToAdd = 0;
            if (manualRegisterType === 'unit') {
                if (manualMaterial === 'plastico') co2ToAdd = 0.05 * (qty || 1);
                else if (manualMaterial === 'lata') co2ToAdd = 0.15 * (qty || 1);
            } else {
                // If weight registered:
                const weightInKg = weightUnitVal === 'lb' ? (weightVal || 0) * 0.453592 : (weightVal || 0);
                if (manualMaterial === 'plastico') co2ToAdd = 1.67 * weightInKg;
                else if (manualMaterial === 'lata') co2ToAdd = 10.0 * weightInKg;
            }

            // 1. Insert into recycling_logs
            const { error: logError } = await supabase
                .from('recycling_logs')
                .insert({
                    user_id: manualSelectedUser.id,
                    material: manualMaterial,
                    puntos_ganados: totalPoints,
                    qr_validated: true,
                    cantidad: manualRegisterType === 'unit' ? qty : null,
                    peso: manualRegisterType === 'weight' ? weightVal : null,
                    unidad_peso: manualRegisterType === 'weight' ? weightUnitVal : null,
                    tipo_detalle: finalDetail,
                    location: 'Registro Manual (Admin)'
                });

            if (logError) throw logError;

            // 2. Fetch current points and scans of the user
            const { data: currentProf, error: fetchError } = await supabase
                .from('profiles')
                .select('eco_puntos, total_scans, total_co2_saved')
                .eq('id', manualSelectedUser.id)
                .single();

            if (fetchError) throw fetchError;

            // 3. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    eco_puntos: (currentProf.eco_puntos || 0) + totalPoints,
                    total_scans: (currentProf.total_scans || 0) + 1,
                    total_co2_saved: (currentProf.total_co2_saved || 0) + co2ToAdd,
                    updated_at: new Date().toISOString()
                })
                .eq('id', manualSelectedUser.id);

            if (profileError) throw profileError;

            // Reset form and UI state
            setSuccessMessage(`¡Registro manual exitoso! Se acreditaron +${totalPoints} ⭐ eco-puntos y se sumaron ${co2ToAdd.toFixed(2)} kg CO₂ a ${manualSelectedUser.name || 'el estudiante'}.`);
            
            // Clean up selections
            setManualSelectedUser(null);
            setManualUserQuery('');
            setManualCantidad(1);
            setManualWeight('');
            setManualMaterial('plastico');
            setManualSubtype('Botella PET pequeña (< 600ml)');
            setManualOtroDetalle('');
            
            // Refresh data in tables and counters
            fetchAdminData();
        } catch (err: any) {
            console.error('Error al registrar manualmente:', err);
            setErrorMessage('Error al realizar el registro manual: ' + err.message);
        } finally {
            setManualIsSaving(false);
        }
    };

    // Save points config by weight (admin)
    const handleSaveWeightConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const updates = [
                { material: 'plastico', points_per_kg: configPlasticPerKg, points_per_lb: configPlasticPerLb, updated_at: new Date().toISOString() },
                { material: 'lata', points_per_kg: configLataPerKg, points_per_lb: configLataPerLb, updated_at: new Date().toISOString() },
                { material: 'comun', points_per_kg: configComunPerKg, points_per_lb: configComunPerLb, updated_at: new Date().toISOString() }
            ];

            for (const update of updates) {
                const { error } = await supabase
                    .from('weight_points_config')
                    .upsert(update);
                if (error) throw error;
            }

            setSuccessMessage("Configuración de puntos por peso actualizada exitosamente.");
            fetchAdminData();
        } catch (err: any) {
            console.error("Error al actualizar la configuración de puntos:", err);
            setErrorMessage("Error al guardar la configuración: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter profiles based on search query
    const filteredProfiles = profiles.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
            (p.name?.toLowerCase().includes(query)) ||
            (p.carnet?.toLowerCase().includes(query)) ||
            (p.id.toLowerCase().includes(query))
        );
    });

    // Filter coupons based on search query
    const filteredCoupons = coupons.filter(c => {
        const query = couponSearch.toLowerCase();
        return (
            c.code.toLowerCase().includes(query) ||
            (c.profile_name?.toLowerCase().includes(query)) ||
            (c.profile_carnet?.toLowerCase().includes(query))
        );
    });

    // Filter profiles for manual selection based on manualUserQuery
    const manualFilteredProfiles = manualUserQuery.trim() === ''
        ? []
        : profiles.filter(p => {
            const query = manualUserQuery.toLowerCase();
            return (
                (p.name?.toLowerCase().includes(query)) ||
                (p.carnet?.toLowerCase().includes(query))
            );
        }).slice(0, 5);

    if (loading || !profile || !profile.is_admin) {
        return (
            <main className="min-h-screen bg-eco-cream pt-20 px-4 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eco-green mx-auto" />
                    <p className="text-eco-green-dark font-medium">Verificando permisos de administración...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 page-enter">
                
                {/* Header Card with glow */}
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                    <div className="eco-gradient p-6 sm:p-8 text-white relative">
                        {/* Ambient glow decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                        <div className="relative">
                            <span className="text-[10px] sm:text-xs font-bold uppercase bg-white/20 text-white px-2.5 py-1 rounded-full tracking-wider">
                                Panel Administrativo UGB
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight">
                                Observatorio Verde · Dashboard Global
                            </h1>
                            <p className="text-sm text-white/80 mt-1 max-w-2xl">
                                Supervisa el estado de reciclaje en el campus, edita puntos de estudiantes y valida cupones de descuento digitales.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Alerts */}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                        <span className="text-lg">✅</span>
                        <p className="text-sm font-medium">{successMessage}</p>
                        <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">✕</button>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p className="text-sm font-medium">{errorMessage}</p>
                        <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                    </div>
                )}

                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card glass className="relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                        <div className="text-xs font-medium text-eco-gray uppercase tracking-wider">Estudiantes</div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-eco-green-dark mt-1">
                            {stats.totalUsers}
                        </div>
                        <div className="text-[10px] text-eco-green font-medium mt-1">Registrados UGB</div>
                        <div className="absolute top-4 right-4 text-2xl opacity-20">👥</div>
                    </Card>

                    <Card glass className="relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                        <div className="text-xs font-medium text-eco-gray uppercase tracking-wider">Eco-Puntos Otorgados</div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-eco-green-dark mt-1">
                            {stats.totalPoints} ⭐
                        </div>
                        <div className="text-[10px] text-eco-green font-medium mt-1">Balance total circulante</div>
                        <div className="absolute top-4 right-4 text-2xl opacity-20">🪙</div>
                    </Card>

                    <Card glass className="relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                        <div className="text-xs font-medium text-eco-gray uppercase tracking-wider">Residuos Clasificados</div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-eco-green-dark mt-1">
                            {stats.totalScans}
                        </div>
                        <div className="text-[10px] text-eco-green font-medium mt-1">
                            🟢 {stats.materialStats.plastico} | 🟡 {stats.materialStats.lata} | ⚫ {stats.materialStats.comun}
                        </div>
                        <div className="absolute top-4 right-4 text-2xl opacity-20">♻️</div>
                    </Card>

                    <Card glass className="relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
                        <div className="text-xs font-medium text-eco-gray uppercase tracking-wider">CO₂ Evitado</div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-eco-green-dark mt-1">
                            {stats.totalCO2.toFixed(2)} kg
                        </div>
                        <div className="text-[10px] text-eco-green font-medium mt-1">Huella de carbono reducida</div>
                        <div className="absolute top-4 right-4 text-2xl opacity-20">🍃</div>
                    </Card>
                </div>

                {/* Tab Controls */}
                <div className="flex border-b border-eco-green/10 gap-1 overflow-x-auto pb-px">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                            activeTab === 'users'
                                ? 'bg-white border-t border-x border-eco-green/20 text-eco-green-dark shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                                : 'text-eco-gray hover:text-eco-green-dark hover:bg-white/40'
                        }`}
                    >
                        👥 Gestión de Estudiantes
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                            activeTab === 'coupons'
                                ? 'bg-white border-t border-x border-eco-green/20 text-eco-green-dark shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                                : 'text-eco-gray hover:text-eco-green-dark hover:bg-white/40'
                        }`}
                    >
                        🏪 Validación de Cupones ({coupons.filter(c => !c.is_redeemed).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                            activeTab === 'logs'
                                ? 'bg-white border-t border-x border-eco-green/20 text-eco-green-dark shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                                : 'text-eco-gray hover:text-eco-green-dark hover:bg-white/40'
                        }`}
                    >
                        📋 Bitácora de Reciclaje
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                            activeTab === 'manual'
                                ? 'bg-white border-t border-x border-eco-green/20 text-eco-green-dark shadow-[0_-4px_12px_rgba(0,0,0,0.02)] text-eco-green-dark'
                                : 'text-eco-gray hover:text-eco-green-dark hover:bg-white/40'
                        }`}
                    >
                        ➕ Registro Manual
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all ${
                            activeTab === 'config'
                                ? 'bg-white border-t border-x border-eco-green/20 text-eco-green-dark shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                                : 'text-eco-gray hover:text-eco-green-dark hover:bg-white/40'
                        }`}
                    >
                        ⚖️ Configurar Puntos
                    </button>
                </div>

                {/* Content Area */}
                <Card padding="none" className="overflow-hidden border border-eco-green/10 bg-white">
                    {loadingData ? (
                        <div className="p-12 text-center text-eco-gray space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eco-green mx-auto" />
                            <p className="text-sm">Cargando base de datos...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: USER MANAGEMENT */}
                            {activeTab === 'users' && (
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                                        <h2 className="text-lg font-bold text-eco-green-dark">Base de Estudiantes UGB</h2>
                                        <div className="relative w-full sm:w-64">
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre o carnet..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 text-sm bg-eco-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green focus:ring-1 focus:ring-eco-green/20 transition-all"
                                            />
                                            <span className="absolute left-3 top-2.5 text-eco-gray text-xs">🔍</span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-gray-100">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-eco-cream/50 text-eco-green-dark font-semibold border-b border-gray-100">
                                                    <th className="p-3 sm:p-4">Estudiante</th>
                                                    <th className="p-3 sm:p-4">Carnet</th>
                                                    <th className="p-3 sm:p-4">Facultad</th>
                                                    <th className="p-3 sm:p-4 text-center">Eco-Puntos</th>
                                                    <th className="p-3 sm:p-4 text-center">Escaneos</th>
                                                    <th className="p-3 sm:p-4 text-center">Rol</th>
                                                    <th className="p-3 sm:p-4 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredProfiles.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="p-8 text-center text-eco-gray">
                                                            No se encontraron estudiantes registrados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredProfiles.map((prof) => {
                                                        const userFaculty = faculties.find(f => f.id === prof.faculty_id);
                                                        return (
                                                            <tr key={prof.id} className="hover:bg-eco-cream/10 transition-colors">
                                                                <td className="p-3 sm:p-4 font-semibold text-eco-green-dark">
                                                                    {prof.name || 'Estudiante Sin Nombre'}
                                                                </td>
                                                                <td className="p-3 sm:p-4 font-mono text-xs">{prof.carnet || '—'}</td>
                                                                <td className="p-3 sm:p-4">
                                                                    {userFaculty ? (
                                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${userFaculty.color}15`, color: userFaculty.color }}>
                                                                            <span>{userFaculty.emoji}</span>
                                                                            <span>{userFaculty.name}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-xs">Sin Facultad</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 sm:p-4 text-center font-bold text-eco-green-dark">
                                                                    {prof.eco_puntos} ⭐
                                                                </td>
                                                                <td className="p-3 sm:p-4 text-center">{prof.total_scans}</td>
                                                                <td className="p-3 sm:p-4 text-center">
                                                                    {prof.is_admin ? (
                                                                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100">
                                                                            ADMIN
                                                                        </span>
                                                                    ) : (
                                                                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-md">
                                                                            Estudiante
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 sm:p-4 text-right">
                                                                    <Button
                                                                        onClick={() => {
                                                                            setEditingUser(prof);
                                                                            setEditPoints(prof.eco_puntos);
                                                                            setEditFaculty(prof.faculty_id || '');
                                                                            setEditIsAdmin(!!prof.is_admin);
                                                                        }}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="hover:!bg-eco-green hover:!text-white"
                                                                    >
                                                                        ⚙️ Editar
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: COUPONS VALIDATION */}
                            {activeTab === 'coupons' && (
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                                        <div>
                                            <h2 className="text-lg font-bold text-eco-green-dark">Cupones UGB Store</h2>
                                            <p className="text-xs text-eco-gray">Canjea y valida los cupones que los estudiantes muestren en sus pantallas</p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <div className="relative w-full sm:w-64">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por código..."
                                                    value={couponSearch}
                                                    onChange={(e) => setCouponSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 text-sm bg-eco-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green focus:ring-1 focus:ring-eco-green/20 transition-all"
                                                />
                                                <span className="absolute left-3 top-2.5 text-eco-gray text-xs">🔍</span>
                                            </div>
                                            <Button
                                                onClick={() => setIsScanningQR(true)}
                                                variant="outline"
                                                size="sm"
                                                className="!py-2 flex items-center gap-1 shrink-0"
                                            >
                                                📷 Escanear QR
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-gray-100">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-eco-cream/50 text-eco-green-dark font-semibold border-b border-gray-100">
                                                    <th className="p-3 sm:p-4">Código de Cupón</th>
                                                    <th className="p-3 sm:p-4">Estudiante</th>
                                                    <th className="p-3 sm:p-4">Carnet</th>
                                                    <th className="p-3 sm:p-4">Descripción</th>
                                                    <th className="p-3 sm:p-4 text-center">Descuento</th>
                                                    <th className="p-3 sm:p-4 text-center">Costo Puntos</th>
                                                    <th className="p-3 sm:p-4 text-center">Estado</th>
                                                    <th className="p-3 sm:p-4 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredCoupons.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-eco-gray">
                                                            No se encontraron cupones en el catálogo de transacciones.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCoupons.map((coupon) => (
                                                        <tr key={coupon.id} className="hover:bg-eco-cream/10 transition-colors">
                                                            <td className="p-3 sm:p-4 font-mono font-bold text-eco-green-dark">
                                                                {coupon.code}
                                                            </td>
                                                            <td className="p-3 sm:p-4 font-medium">{coupon.profile_name}</td>
                                                            <td className="p-3 sm:p-4 font-mono text-xs">{coupon.profile_carnet}</td>
                                                            <td className="p-3 sm:p-4 text-xs">{coupon.description}</td>
                                                            <td className="p-3 sm:p-4 text-center font-bold text-eco-green">
                                                                {coupon.discount_percent}%
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-center text-gray-500 font-medium">
                                                                {coupon.puntos_cost} ⭐
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-center">
                                                                {coupon.is_redeemed ? (
                                                                    <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                                                        Canjeado
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                                                                        Disponible
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-right">
                                                                {!coupon.is_redeemed ? (
                                                                    <Button
                                                                        onClick={() => handleRedeemCoupon(coupon.id)}
                                                                        variant="primary"
                                                                        size="sm"
                                                                        className="shadow-sm shadow-eco-green/10"
                                                                        disabled={isSaving}
                                                                    >
                                                                        🎟️ Validar y Canjear
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">Validado ✓</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: RECYCLING LOGS */}
                            {activeTab === 'logs' && (
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-eco-green-dark">Historial General de Reciclaje</h2>
                                        <div className="text-xs text-eco-gray">Historial de depósitos de residuos (Últimos {recyclingLogs.length})</div>
                                    </div>

                                    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-gray-100">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-eco-cream/50 text-eco-green-dark font-semibold border-b border-gray-100">
                                                    <th className="p-3 sm:p-4">Estudiante</th>
                                                    <th className="p-3 sm:p-4">Carnet</th>
                                                    <th className="p-3 sm:p-4">Material</th>
                                                    <th className="p-3 sm:p-4 text-center">Cant./Peso</th>
                                                    <th className="p-3 sm:p-4 text-center">Puntos Obtenidos</th>
                                                    <th className="p-3 sm:p-4 text-center">Estado QR</th>
                                                    <th className="p-3 sm:p-4">Ubicación</th>
                                                    <th className="p-3 sm:p-4 text-right">Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {recyclingLogs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="p-8 text-center text-eco-gray">
                                                            No se han registrado transacciones de reciclaje en el sistema.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    recyclingLogs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-eco-cream/10 transition-colors">
                                                            <td className="p-3 sm:p-4 font-semibold text-eco-green-dark">
                                                                {log.profile_name}
                                                            </td>
                                                            <td className="p-3 sm:p-4 font-mono text-xs">{log.profile_carnet}</td>
                                                            <td className="p-3 sm:p-4">
                                                                <div className="flex flex-col">
                                                                    <div>
                                                                        {log.material === 'plastico' && (
                                                                            <span className="bg-green-100 text-green-700 text-[11px] px-2 py-0.5 rounded-full font-medium">
                                                                                🟢 Plástico (PET)
                                                                            </span>
                                                                        )}
                                                                        {log.material === 'lata' && (
                                                                            <span className="bg-amber-100 text-amber-700 text-[11px] px-2 py-0.5 rounded-full font-medium">
                                                                                🟡 Aluminio (Lata)
                                                                            </span>
                                                                        )}
                                                                        {log.material === 'comun' && (
                                                                            <span className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-medium">
                                                                                ⚫ Común (Descarte)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {log.tipo_detalle && (
                                                                        <span className="text-[10px] text-gray-500 font-semibold mt-1">
                                                                            {log.tipo_detalle}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-center font-bold text-eco-green-dark">
                                                                {log.peso ? `${log.peso} ${log.unidad_peso}` : `x${log.cantidad || 1}`}
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-center font-bold text-eco-green-dark">
                                                                +{log.puntos_ganados} ⭐
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-center">
                                                                {log.qr_validated ? (
                                                                    <span className="text-emerald-600 text-xs font-semibold">Validado</span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">Automático</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 sm:p-4 text-xs text-eco-gray">{log.location || 'Bin Principal'}</td>
                                                            <td className="p-3 sm:p-4 text-right text-xs text-eco-gray">
                                                                {new Date(log.created_at).toLocaleDateString('es', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: MANUAL REGISTER */}
                            {activeTab === 'manual' && (
                                <div className="p-4 sm:p-6 space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-eco-green-dark">Registro Manual de Desechos</h2>
                                            <p className="text-xs text-eco-gray mt-0.5">Acredita Eco-Puntos y registra residuos directamente a la cuenta del estudiante</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleManualRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column: Student Search & Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-eco-green-dark uppercase tracking-wider">1. Buscar Estudiante</h3>
                                            
                                            {!manualSelectedUser ? (
                                                <div className="space-y-2 relative">
                                                    <label htmlFor="manual-student-search" className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                        Buscar por nombre o carnet
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="manual-student-search"
                                                            type="text"
                                                            placeholder="Ej. SMSS141122 o Juan Pérez..."
                                                            value={manualUserQuery}
                                                            onChange={(e) => setManualUserQuery(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 bg-eco-cream/30 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green focus:ring-2 focus:ring-eco-green/15 transition-all text-sm animate-fade-in"
                                                        />
                                                        <span className="absolute left-3.5 top-3.5 text-eco-gray text-sm">🔍</span>
                                                        {manualUserQuery && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualUserQuery('')}
                                                                className="absolute right-3.5 top-3.5 text-xs text-gray-400 hover:text-gray-600"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Autocomplete Dropdown list */}
                                                    {manualFilteredProfiles.length > 0 && (
                                                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-50 overflow-hidden max-h-60 overflow-y-auto animate-fade-in">
                                                            {manualFilteredProfiles.map((p) => {
                                                                const userFaculty = faculties.find(f => f.id === p.faculty_id);
                                                                return (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setManualSelectedUser(p);
                                                                            setManualUserQuery('');
                                                                        }}
                                                                        className="w-full text-left p-3 hover:bg-eco-cream/40 transition-colors flex items-center justify-between gap-2"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <p className="font-semibold text-sm text-eco-green-dark truncate">{p.name || 'Estudiante Sin Nombre'}</p>
                                                                            <p className="text-xs text-eco-gray font-mono mt-0.5">{p.carnet || 'S/C'}</p>
                                                                        </div>
                                                                        {userFaculty && (
                                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${userFaculty.color}15`, color: userFaculty.color }}>
                                                                                {userFaculty.emoji} {userFaculty.short_name}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {manualUserQuery.trim() !== '' && manualFilteredProfiles.length === 0 && (
                                                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-xs text-eco-gray animate-fade-in">
                                                            No se encontraron estudiantes que coincidan.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-eco-cream/35 border border-eco-green/10 rounded-2xl p-5 space-y-4 animate-scale-in relative overflow-hidden">
                                                    {/* Ambient decoration */}
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-eco-green/5 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3" />
                                                    
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-eco-green bg-eco-green/10 px-2 py-0.5 rounded-full">
                                                                Estudiante Seleccionado
                                                            </span>
                                                            <h4 className="font-extrabold text-base text-eco-green-dark mt-2">
                                                                {manualSelectedUser.name || 'Estudiante UGB'}
                                                            </h4>
                                                            <p className="text-xs font-mono text-eco-gray mt-0.5">Carnet: {manualSelectedUser.carnet || 'S/C'}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setManualSelectedUser(null)}
                                                            className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 px-2.5 py-1 rounded-lg transition-all"
                                                        >
                                                            Cambiar
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-eco-green/10">
                                                        <div>
                                                            <p className="text-[10px] text-eco-gray font-semibold uppercase">Puntos Actuales</p>
                                                            <p className="text-sm font-bold text-eco-green-dark mt-0.5">{manualSelectedUser.eco_puntos} ⭐</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-eco-gray font-semibold uppercase">Facultad</p>
                                                            {(() => {
                                                                const userFaculty = faculties.find(f => f.id === manualSelectedUser.faculty_id);
                                                                return userFaculty ? (
                                                                    <p className="text-xs font-bold mt-0.5 truncate" style={{ color: userFaculty.color }}>
                                                                        {userFaculty.emoji} {userFaculty.name}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 mt-0.5">Sin Facultad</p>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                         {/* Right Column: Waste Details */}
                                         <div className="space-y-4">
                                             <h3 className="text-sm font-bold text-eco-green-dark uppercase tracking-wider">2. Detalles del Residuo</h3>
 
                                             {/* Tipo de Registro (Unidades vs Peso) */}
                                             <div className="space-y-2">
                                                 <label className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                     Tipo de Registro
                                                 </label>
                                                 <div className="flex bg-eco-cream/50 p-1 rounded-xl border border-gray-200">
                                                     <button
                                                         type="button"
                                                         onClick={() => setManualRegisterType('unit')}
                                                         className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                             manualRegisterType === 'unit'
                                                                 ? 'bg-white text-eco-green-dark shadow-sm'
                                                                 : 'text-eco-gray hover:text-eco-green-dark'
                                                         }`}
                                                     >
                                                         🔢 Por Unidad
                                                     </button>
                                                     <button
                                                         type="button"
                                                         onClick={() => setManualRegisterType('weight')}
                                                         className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                             manualRegisterType === 'weight'
                                                                 ? 'bg-white text-eco-green-dark shadow-sm'
                                                                 : 'text-eco-gray hover:text-eco-green-dark'
                                                         }`}
                                                     >
                                                         ⚖️ Por Peso
                                                     </button>
                                                 </div>
                                             </div>
 
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                 {/* Material Selector */}
                                                 <div className="space-y-2">
                                                     <label htmlFor="manual-material-select" className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                         Tipo de Residuos
                                                     </label>
                                                     <select
                                                         id="manual-material-select"
                                                         value={manualMaterial}
                                                         onChange={(e) => setManualMaterial(e.target.value as any)}
                                                         className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-eco-green transition-colors font-medium text-eco-green-dark"
                                                     >
                                                         <option value="plastico">🟢 Plástico (PET)</option>
                                                         <option value="lata">🟡 Aluminio (Lata)</option>
                                                         <option value="comun">⚫ Basura Común</option>
                                                     </select>
                                                 </div>
 
                                                 {/* Quantity or Weight Selector */}
                                                 {manualRegisterType === 'unit' ? (
                                                     <div className="space-y-2">
                                                         <label className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                             Cantidad (Unidades)
                                                         </label>
                                                         <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-[41px]">
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setManualCantidad(prev => Math.max(1, (typeof prev === 'number' ? prev : 1) - 1))}
                                                                 className="px-3 h-full hover:bg-gray-100 active:bg-gray-200 text-lg font-bold text-eco-green-dark transition-colors border-r border-gray-200"
                                                             >
                                                                 -
                                                             </button>
                                                             <input
                                                                 type="number"
                                                                 min="1"
                                                                 max="999"
                                                                 value={manualCantidad}
                                                                 onChange={(e) => {
                                                                     const val = e.target.value;
                                                                     if (val === '') {
                                                                         setManualCantidad('');
                                                                     } else {
                                                                         const parsed = parseInt(val, 10);
                                                                         setManualCantidad(isNaN(parsed) ? 1 : Math.max(1, Math.min(999, parsed)));
                                                                     }
                                                                 }}
                                                                 onBlur={() => {
                                                                     if (manualCantidad === '') {
                                                                         setManualCantidad(1);
                                                                     }
                                                                 }}
                                                                 className="w-full bg-transparent text-center text-sm font-bold text-eco-green-dark focus:outline-none"
                                                             />
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setManualCantidad(prev => Math.min(999, (typeof prev === 'number' ? prev : 1) + 1))}
                                                                 className="px-3 h-full hover:bg-gray-100 active:bg-gray-200 text-lg font-bold text-eco-green-dark transition-colors border-l border-gray-200"
                                                             >
                                                                 +
                                                             </button>
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <div className="space-y-2">
                                                         <label className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                             Peso Registrado
                                                         </label>
                                                         <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden h-[41px]">
                                                             <input
                                                                 type="number"
                                                                 step="0.01"
                                                                 min="0.01"
                                                                 placeholder="0.00"
                                                                 value={manualWeight}
                                                                 onChange={(e) => {
                                                                     const val = e.target.value;
                                                                     if (val === '') {
                                                                         setManualWeight('');
                                                                     } else {
                                                                         const parsed = parseFloat(val);
                                                                         setManualWeight(isNaN(parsed) ? '' : parsed);
                                                                     }
                                                                 }}
                                                                 className="w-full pl-3 bg-transparent text-left text-sm font-bold text-eco-green-dark focus:outline-none"
                                                             />
                                                             <select
                                                                 value={manualWeightUnit}
                                                                 onChange={(e) => setManualWeightUnit(e.target.value as any)}
                                                                 className="px-2 h-full bg-gray-100 border-l border-gray-200 text-xs font-bold text-eco-green-dark focus:outline-none outline-none"
                                                             >
                                                                 <option value="kg">kg</option>
                                                                 <option value="lb">lb</option>
                                                             </select>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
 
                                             {/* Subtype Selector */}
                                             <div className="space-y-2">
                                                 <label htmlFor="manual-subtype-select" className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                     Subtipo de Material
                                                 </label>
                                                 <select
                                                     id="manual-subtype-select"
                                                     value={manualSubtype}
                                                     onChange={(e) => setManualSubtype(e.target.value)}
                                                     className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-eco-green transition-colors font-medium text-eco-green-dark"
                                                 >
                                                     {manualMaterial === 'plastico' && (
                                                         <>
                                                             <option value="Botella PET pequeña (< 600ml)">Botella PET pequeña (&lt; 600ml) [15 pts]</option>
                                                             <option value="Botella PET grande (>= 600ml)">Botella PET grande (&gt;= 600ml) [15 pts]</option>
                                                             <option value="Envase HDPE (Jugos/Lácteos)">Envase HDPE (Jugos/Lácteos) [15 pts]</option>
                                                             <option value="Vaso Desechable Plástico">Vaso Desechable Plástico [15 pts]</option>
                                                             <option value="otro">Otro plástico reciclable...</option>
                                                         </>
                                                     )}
                                                     {manualMaterial === 'lata' && (
                                                         <>
                                                             <option value="Lata de Refresco/Bebida (Aluminio)">Lata de Refresco/Bebida (Aluminio) [20 pts]</option>
                                                             <option value="Lata de Conservas (Hojalata)">Lata de Conservas (Hojalata) [20 pts]</option>
                                                             <option value="Lata de Aluminio (Otros)">Lata de Aluminio (Otros) [20 pts]</option>
                                                             <option value="otro">Otro metal/lata reciclable...</option>
                                                         </>
                                                     )}
                                                     {manualMaterial === 'comun' && (
                                                         <>
                                                             <option value="Envolturas/Empaques de Snacks">Envolturas/Empaques de Snacks [0 pts]</option>
                                                             <option value="Papel/Cartón Sucio">Papel/Cartón Sucio [0 pts]</option>
                                                             <option value="Servilletas/Pañuelos Usados">Servilletas/Pañuelos Usados [0 pts]</option>
                                                             <option value="otro">Otro residuo común...</option>
                                                         </>
                                                     )}
                                                 </select>
                                             </div>
 
                                             {/* Otro Input */}
                                             {manualSubtype === 'otro' && (
                                                 <div className="space-y-2 animate-fade-in">
                                                     <label htmlFor="manual-otro-detalle" className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                         Especificar Detalle del Material
                                                     </label>
                                                     <input
                                                         id="manual-otro-detalle"
                                                         type="text"
                                                         placeholder="Ej. Envase de yogurt, Alambre de cobre, etc."
                                                         value={manualOtroDetalle}
                                                         onChange={(e) => setManualOtroDetalle(e.target.value)}
                                                         className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-eco-green transition-all"
                                                         required
                                                     />
                                                 </div>
                                             )}
 
                                             {/* Puntos Ajustables */}
                                             <div className="space-y-2">
                                                 <label className="block text-xs font-semibold text-eco-gray uppercase tracking-wider">
                                                     Eco-Puntos a Asignar (Ajustable)
                                                 </label>
                                                 <input
                                                     type="number"
                                                     value={manualOverridePoints}
                                                     onChange={(e) => setManualOverridePoints(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                                     className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-eco-green transition-all font-bold text-eco-green-dark"
                                                     min="0"
                                                 />
                                             </div>
 
                                             {/* Summary Calculation Box */}
                                             {(() => {
                                                 const config = weightConfigs.find(c => c.material === manualMaterial);
                                                 const rate = manualWeightUnit === 'kg' ? config?.points_per_kg : config?.points_per_lb;
                                                 const calculatedPoints = manualRegisterType === 'unit'
                                                     ? (manualMaterial === 'plastico' ? 15 : manualMaterial === 'lata' ? 20 : 0) * (Number(manualCantidad) || 1)
                                                     : Math.round((rate || 0) * (Number(manualWeight) || 0));
                                                 
                                                 let co2ToAdd = 0;
                                                 if (manualRegisterType === 'unit') {
                                                     if (manualMaterial === 'plastico') co2ToAdd = 0.05 * (Number(manualCantidad) || 1);
                                                     else if (manualMaterial === 'lata') co2ToAdd = 0.15 * (Number(manualCantidad) || 1);
                                                 } else {
                                                     const weightInKg = manualWeightUnit === 'lb' ? (Number(manualWeight) || 0) * 0.453592 : (Number(manualWeight) || 0);
                                                     if (manualMaterial === 'plastico') co2ToAdd = 1.67 * weightInKg;
                                                     else if (manualMaterial === 'lata') co2ToAdd = 10.0 * weightInKg;
                                                 }
                                                 return (
                                                     <div className="bg-eco-cream/25 border border-dashed border-eco-green/20 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                                                         <div className="flex justify-between items-center text-eco-gray font-semibold">
                                                             <span>Tarifa Establecida:</span>
                                                             <span>
                                                                 {manualRegisterType === 'unit'
                                                                     ? `${manualMaterial === 'plastico' ? '15' : manualMaterial === 'lata' ? '20' : '0'} ⭐ / unidad`
                                                                     : `${rate || 0} ⭐ / ${manualWeightUnit}`}
                                                             </span>
                                                         </div>
                                                         <div className="flex justify-between items-center text-eco-gray font-semibold">
                                                             <span>Tasa de CO₂ Evitado:</span>
                                                             <span>
                                                                 {manualRegisterType === 'unit'
                                                                     ? `${manualMaterial === 'plastico' ? '0.05' : manualMaterial === 'lata' ? '0.15' : '0'} kg / unidad`
                                                                     : `${manualMaterial === 'plastico' ? '1.67' : manualMaterial === 'lata' ? '10.0' : '0'} kg / kg`}
                                                             </span>
                                                         </div>
                                                         <div className="flex justify-between items-center pt-2 border-t border-dashed border-eco-green/10 font-bold text-eco-green-dark">
                                                             <span>Puntos Calculados Automáticamente:</span>
                                                             <span>
                                                                 +{calculatedPoints} ⭐
                                                             </span>
                                                         </div>
                                                         <div className="flex justify-between items-center">
                                                             <span className="text-eco-gray font-semibold">Total CO₂ Evitado Estimado:</span>
                                                             <span className="font-bold text-eco-green">
                                                                 +{co2ToAdd.toFixed(2)} kg
                                                             </span>
                                                         </div>
                                                     </div>
                                                 );
                                             })()}
 
                                             {/* Submit Button */}
                                             <Button
                                                 type="submit"
                                                 variant="primary"
                                                 size="lg"
                                                 className="w-full shadow-lg shadow-eco-green/10"
                                                 disabled={!manualSelectedUser || manualIsSaving}
                                                 isLoading={manualIsSaving}
                                             >
                                                 ✍️ Registrar Desechos y Asignar Puntos
                                             </Button>
                                         </div>
                                     </form>
                                </div>
                            )}

                            {/* TAB 5: POINTS CONFIGURATION */}
                            {activeTab === 'config' && (
                                <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-eco-green-dark">⚙️ Configuración de Puntos por Peso</h2>
                                            <p className="text-xs text-eco-gray mt-0.5">Establece las equivalencias de puntos por kilogramo y por libra de residuo</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveWeightConfig} className="space-y-6 max-w-2xl">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            {/* Plastico */}
                                            <Card className="border border-green-100/50 bg-green-50/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-xl">🟢</span>
                                                    <h3 className="font-bold text-eco-green-dark text-sm">Plástico (PET)</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Kilogramo (Kg)</label>
                                                        <input
                                                            type="number"
                                                            value={configPlasticPerKg}
                                                            onChange={(e) => setConfigPlasticPerKg(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Libra (Lb)</label>
                                                        <input
                                                            type="number"
                                                            value={configPlasticPerLb}
                                                            onChange={(e) => setConfigPlasticPerLb(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Lata */}
                                            <Card className="border border-amber-100/50 bg-amber-50/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-xl">🟡</span>
                                                    <h3 className="font-bold text-eco-green-dark text-sm">Aluminio (Lata)</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Kilogramo (Kg)</label>
                                                        <input
                                                            type="number"
                                                            value={configLataPerKg}
                                                            onChange={(e) => setConfigLataPerKg(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Libra (Lb)</label>
                                                        <input
                                                            type="number"
                                                            value={configLataPerLb}
                                                            onChange={(e) => setConfigLataPerLb(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Basura Comun */}
                                            <Card className="border border-gray-200 bg-gray-50/10">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-xl">⚫</span>
                                                    <h3 className="font-bold text-eco-green-dark text-sm">Basura Común</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Kilogramo (Kg)</label>
                                                        <input
                                                            type="number"
                                                            value={configComunPerKg}
                                                            onChange={(e) => setConfigComunPerKg(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-eco-gray uppercase">Puntos por Libra (Lb)</label>
                                                        <input
                                                            type="number"
                                                            value={configComunPerLb}
                                                            onChange={(e) => setConfigComunPerLb(Math.max(0, parseInt(e.target.value) || 0))}
                                                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-eco-green-dark focus:outline-none focus:border-eco-green"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="w-full sm:w-auto shadow-md shadow-eco-green/10"
                                            disabled={isSaving}
                                            isLoading={isSaving}
                                        >
                                            💾 Guardar Configuración de Puntos
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </Card>

                {/* USER EDIT MODAL */}
                {editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
                            <div className="eco-gradient p-5 text-white flex justify-between items-center">
                                <h3 className="font-bold text-lg">⚙️ Configurar Estudiante</h3>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-white hover:text-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-eco-gray uppercase">Estudiante</label>
                                    <div className="text-sm font-bold text-eco-green-dark mt-1 bg-eco-cream/50 p-2.5 rounded-lg">
                                        {editingUser.name || 'Estudiante UGB'}
                                    </div>
                                    <p className="text-[10px] text-eco-gray mt-1 font-mono">ID: {editingUser.id}</p>
                                </div>

                                <div>
                                    <label htmlFor="edit-points" className="block text-xs font-semibold text-eco-gray uppercase">Eco-Puntos ⭐</label>
                                    <input
                                        type="number"
                                        id="edit-points"
                                        value={editPoints}
                                        onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                                        min={0}
                                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green transition-colors text-base font-semibold text-eco-green-dark"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-faculty" className="block text-xs font-semibold text-eco-gray uppercase">Facultad</label>
                                    <select
                                        id="edit-faculty"
                                        value={editFaculty}
                                        onChange={(e) => setEditFaculty(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-eco-green transition-colors text-sm"
                                    >
                                        <option value="">-- Sin Facultad --</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.emoji} {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        id="edit-isadmin"
                                        checked={editIsAdmin}
                                        onChange={(e) => handleAdminToggle(e.target.checked)}
                                        className="w-4 h-4 rounded text-eco-green focus:ring-eco-green border-gray-300"
                                    />
                                    <label htmlFor="edit-isadmin" className="text-sm font-semibold text-eco-green-dark cursor-pointer">
                                        Otorgar Rol Administrador (Acceso al Panel Admin)
                                    </label>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <Button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={isSaving}
                                        isLoading={isSaving}
                                    >
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Escaneo QR de Cupón */}
                {isScanningQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in text-center p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs text-eco-green font-bold uppercase tracking-wider font-mono">Escáner de Cupones UGB</span>
                                <button
                                    onClick={() => setIsScanningQR(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <h3 className="font-bold text-eco-green-dark text-base mb-3">Apunta la cámara al código QR</h3>
                            
                            {/* Visor de Cámara */}
                            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-square max-w-[240px] mx-auto mb-4 border border-gray-200 shadow-inner">
                                <div id="admin-qr-reader" className="w-full h-full object-cover"></div>
                                {/* Laser scan line simulation */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-[85%] h-[85%] border-2 border-white/30 rounded-xl relative">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-eco-emerald" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-eco-emerald" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-eco-emerald" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-eco-emerald" />
                                        <div className="scan-line" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-eco-gray">
                                Coloca el código QR generado por el estudiante frente a la cámara para cargarlo y validarlo al instante en el sistema.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
