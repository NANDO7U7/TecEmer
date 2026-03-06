'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BIN_INFO, supabase } from '@/lib/supabase';
import type { BinType } from '@/lib/supabase';
import { useSerial } from '@/lib/useSerial';
import { useNotifications } from '@/lib/useNotifications';
import Button from '@/components/ui/Button';

interface ScanResult {
    material: BinType;
    confidence: number;
    isRecyclable: boolean;
}

interface QRData {
    token: string;
    logId: string;
    material: BinType;
    points: number;
    expiresAt: number; // timestamp
}

type ScanPhase = 'idle' | 'scanning' | 'waiting_deposit' | 'show_qr' | 'claimed' | 'expired' | 'discard';

interface CameraScannerProps {
    userId?: string;
    onScanComplete?: (material: BinType, points: number) => void;
}

function generateToken(): string {
    return `ECO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function CameraScanner({ userId, onScanComplete }: CameraScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [phase, setPhase] = useState<ScanPhase>('idle');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [countdown, setCountdown] = useState(60);
    const [showConfetti, setShowConfetti] = useState(false);

    const { isConnected, isSupported, error: serialError, connect, sendSignal, disconnect } = useSerial();
    const { notifyPointsClaimed } = useNotifications();

    // Countdown timer for QR expiration
    useEffect(() => {
        if (phase !== 'show_qr' || !qrData) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((qrData.expiresAt - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining <= 0) {
                setPhase('expired');
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [phase, qrData]);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch {
            setError('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((t) => t.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [stopCamera]);

    // 3-Way Discard Classification
    const classifyWaste = (): ScanResult => {
        const roll = Math.random();
        const confidence = 0.70 + Math.random() * 0.28;

        if (roll < 0.35 && confidence >= 0.75) {
            return { material: 'plastico', confidence, isRecyclable: true };
        } else if (roll < 0.65 && confidence >= 0.75) {
            return { material: 'lata', confidence, isRecyclable: true };
        } else {
            const discardConfidence = 0.40 + Math.random() * 0.30;
            return { material: 'comun', confidence: discardConfidence, isRecyclable: false };
        }
    };

    const captureAndScan = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        setPhase('scanning');
        setScanResult(null);
        setQrData(null);
        setShowConfetti(false);

        setTimeout(() => {
            const result = classifyWaste();
            setScanResult(result);

            // Send signal to Arduino
            const binData = BIN_INFO[result.material];
            if (isConnected) {
                sendSignal(binData.serialChar);
            }

            if (result.isRecyclable) {
                // Phase: waiting for deposit confirmation
                setPhase('waiting_deposit');

                // After 2s "deposit confirmation", show QR
                timerRef.current = setTimeout(async () => {
                    const token = generateToken();
                    const expiresAt = Date.now() + 60000; // 60 seconds

                    // Insert log with qr_token (unvalidated)
                    if (userId) {
                        const { data } = await supabase
                            .from('recycling_logs')
                            .insert({
                                user_id: userId,
                                material: result.material,
                                puntos_ganados: binData.points,
                                qr_token: token,
                                qr_validated: false,
                                qr_expires_at: new Date(expiresAt).toISOString(),
                            })
                            .select('id')
                            .single();

                        setQrData({
                            token,
                            logId: data?.id || '',
                            material: result.material,
                            points: binData.points,
                            expiresAt,
                        });
                    } else {
                        setQrData({
                            token,
                            logId: 'demo',
                            material: result.material,
                            points: binData.points,
                            expiresAt,
                        });
                    }

                    setCountdown(60);
                    setPhase('show_qr');
                }, 2000);
            } else {
                // Basura Común — no QR, no points, just log
                setPhase('discard');
                if (userId) {
                    supabase.from('recycling_logs').insert({
                        user_id: userId,
                        material: 'comun',
                        puntos_ganados: 0,
                        qr_validated: true, // auto-validated (no points)
                    });
                    // Increment total_scans only
                    supabase
                        .from('profiles')
                        .select('total_scans')
                        .eq('id', userId)
                        .single()
                        .then(({ data: profile }) => {
                            if (profile) {
                                supabase
                                    .from('profiles')
                                    .update({
                                        total_scans: (profile.total_scans || 0) + 1,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('id', userId);
                            }
                        });
                }
            }
        }, 1500 + Math.random() * 1000);
    };

    // Claim points via QR
    const claimPoints = async () => {
        if (!qrData || !userId) return;

        // Check expiry
        if (Date.now() > qrData.expiresAt) {
            setPhase('expired');
            return;
        }

        // Validate the QR in database
        await supabase
            .from('recycling_logs')
            .update({ qr_validated: true })
            .eq('id', qrData.logId)
            .eq('qr_token', qrData.token);

        // Award points to profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('eco_puntos, total_scans')
            .eq('id', userId)
            .single();

        if (profile) {
            await supabase
                .from('profiles')
                .update({
                    eco_puntos: (profile.eco_puntos || 0) + qrData.points,
                    total_scans: (profile.total_scans || 0) + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);
        }

        setPhase('claimed');
        setShowConfetti(true);
        onScanComplete?.(qrData.material, qrData.points);

        // Send push notification
        notifyPointsClaimed(qrData.points, qrData.material);

        // Hide confetti after 3s
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const resetScan = () => {
        setScanResult(null);
        setCapturedImage(null);
        setPhase('idle');
        setQrData(null);
        setShowConfetti(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 relative">
            {/* Confetti overlay */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-center animate-scale-in">
                        {['🎉', '⭐', '🎊', '♻️', '✨'].map((emoji, i) => (
                            <span
                                key={i}
                                className="absolute text-4xl animate-bounce"
                                style={{
                                    left: `${20 + i * 15}%`,
                                    top: `${10 + (i % 3) * 20}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: `${0.5 + i * 0.2}s`,
                                }}
                            >
                                {emoji}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Arduino Connection */}
            <div className="flex items-center justify-center gap-3">
                {isSupported && (
                    <Button
                        onClick={isConnected ? disconnect : connect}
                        variant={isConnected ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        {isConnected ? '🔗 Arduino Conectado' : '🔌 Conectar Arduino'}
                    </Button>
                )}
                {!isSupported && (
                    <p className="text-xs text-eco-gray text-center">
                        ⚠️ Web Serial no soportado. Usa Chrome o Edge.
                    </p>
                )}
            </div>
            {serialError && <p className="text-xs text-red-500 text-center">{serialError}</p>}

            {/* Camera Viewfinder */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 aspect-[4/3] shadow-xl">
                {phase === 'idle' && !isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl animate-pulse-soft">
                            📷
                        </div>
                        <p className="text-sm">Presiona para activar la cámara</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {capturedImage && (
                    <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
                )}

                {/* Scanning overlay */}
                {phase === 'scanning' && (
                    <div className="absolute inset-0 bg-black/30">
                        <div className="scan-line" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/60 text-white px-6 py-3 rounded-full text-sm font-medium animate-pulse">
                                🔍 Analizando residuo...
                            </div>
                        </div>
                    </div>
                )}

                {/* Waiting deposit overlay */}
                {phase === 'waiting_deposit' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-6 text-center shadow-2xl mx-4 animate-fade-in">
                            <div className="w-12 h-12 border-4 border-eco-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-eco-green-dark">
                                Esperando confirmación del depósito...
                            </p>
                            <p className="text-xs text-eco-gray mt-1">
                                {isConnected ? 'La compuerta se está abriendo' : 'Deposite el residuo'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Corner brackets */}
                {isStreaming && phase === 'idle' && (
                    <>
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-eco-green-light rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-eco-green-light rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-eco-green-light rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-eco-green-light rounded-br-lg" />
                    </>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
                {!isStreaming && phase === 'idle' ? (
                    <Button onClick={startCamera} variant="primary" size="lg">
                        📷 Activar Cámara
                    </Button>
                ) : phase === 'idle' ? (
                    <>
                        <Button onClick={captureAndScan} variant="primary" size="lg">
                            🔍 Escanear
                        </Button>
                        <Button onClick={stopCamera} variant="ghost" size="lg">
                            ✕ Cerrar
                        </Button>
                    </>
                ) : ['claimed', 'expired', 'discard'].includes(phase) ? (
                    <Button onClick={resetScan} variant="secondary" size="lg">
                        🔄 Nuevo Escaneo
                    </Button>
                ) : null}
            </div>

            {/* ===== QR VALIDATION CARD ===== */}
            {phase === 'show_qr' && qrData && scanResult && (
                <div className="rounded-3xl overflow-hidden border-2 border-eco-green shadow-lg animate-fade-in">
                    <div className={`bg-gradient-to-r ${BIN_INFO[scanResult.material].gradientClass} p-5 text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">✅ Material Identificado</p>
                                <p className="text-xl font-bold mt-1">{BIN_INFO[scanResult.material].label}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                                {BIN_INFO[scanResult.material].emoji}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 space-y-5">
                        {/* QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-eco-green/30 shadow-sm">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        token: qrData.token,
                                        userId,
                                        material: qrData.material,
                                        points: qrData.points,
                                        ts: Date.now(),
                                    })}
                                    size={180}
                                    level="M"
                                    fgColor="#2D4F1E"
                                    bgColor="#FFFFFF"
                                />
                            </div>
                            <p className="text-xs text-eco-gray mt-2 font-mono">{qrData.token}</p>
                        </div>

                        {/* Countdown */}
                        <div className="text-center">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${countdown > 20 ? 'bg-green-50 text-green-700' :
                                countdown > 10 ? 'bg-amber-50 text-amber-700' :
                                    'bg-red-50 text-red-700 animate-pulse'
                                }`}>
                                ⏱️ Expira en: <span className="font-bold text-lg">{countdown}s</span>
                            </div>
                        </div>

                        {/* Points preview */}
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm text-gray-500">Puntos a reclamar</span>
                            <span className="font-bold text-eco-green-dark text-xl">+{qrData.points} ⭐</span>
                        </div>

                        {/* Claim Button */}
                        <Button
                            onClick={claimPoints}
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            🎁 Reclamar Puntos
                        </Button>

                        <p className="text-xs text-gray-400 text-center">
                            Presiona para validar y acreditar tus eco-puntos
                        </p>
                    </div>
                </div>
            )}

            {/* ===== CLAIMED SUCCESS ===== */}
            {phase === 'claimed' && qrData && (
                <div className="rounded-3xl overflow-hidden border-2 border-green-400 shadow-lg animate-scale-in bg-white">
                    <div className="p-8 text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">
                            🎉
                        </div>
                        <h3 className="text-2xl font-bold text-eco-green-dark">
                            ¡Puntos validados correctamente!
                        </h3>
                        <p className="text-eco-gray">
                            Se acreditaron <span className="font-bold text-eco-green-dark">+{qrData.points} ⭐</span> eco-puntos a tu cuenta.
                        </p>
                        <p className="text-sm text-eco-gray">
                            Revisa tu Dashboard para ver tu saldo actualizado.
                        </p>
                        <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700 font-mono">
                            Token: {qrData.token} ✅
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EXPIRED ===== */}
            {phase === 'expired' && (
                <div className="rounded-3xl overflow-hidden border-2 border-red-300 shadow-lg animate-fade-in bg-white">
                    <div className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl mx-auto">
                            ⏰
                        </div>
                        <h3 className="text-xl font-bold text-red-700">Código QR Expirado</h3>
                        <p className="text-sm text-gray-500">
                            El tiempo de 60 segundos ha terminado. Los puntos no fueron acreditados.
                        </p>
                        <p className="text-xs text-gray-400">
                            Realiza un nuevo escaneo para intentarlo de nuevo.
                        </p>
                    </div>
                </div>
            )}

            {/* ===== DISCARD (Basura Común) ===== */}
            {phase === 'discard' && scanResult && (
                <div className="rounded-3xl overflow-hidden border-2 border-gray-400 shadow-lg animate-fade-in">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">⚠️ No Identificado</p>
                                <p className="text-2xl font-bold mt-1">Basura Común</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">⚫</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                            <p className="text-sm text-amber-800 font-medium">
                                ⚠️ Residuo no identificado como reciclable.
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Por favor, deposítelo en el contenedor de <strong>Basura Común</strong> (Negro).
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Eco-Puntos</span>
                            <span className="font-medium text-gray-400">Sin puntos (descarte)</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Señal Arduino</span>
                            <span className={`text-sm font-mono px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isConnected ? '✅ Enviado "C"' : '⚠️ No conectado'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                            ⚡ Descarte automático • No se genera código QR
                        </p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
}
