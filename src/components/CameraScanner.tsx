'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BIN_INFO, supabase } from '@/lib/supabase';
import type { BinType } from '@/lib/supabase';
import { useSerial } from '@/lib/useSerial';
import Button from '@/components/ui/Button';

interface ScanResult {
    material: BinType;
    confidence: number;
    isRecyclable: boolean;
}

interface CameraScannerProps {
    userId?: string;
    onScanComplete?: (material: BinType, points: number) => void;
}

export default function CameraScanner({ userId, onScanComplete }: CameraScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const { isConnected, isSupported, error: serialError, connect, sendSignal, disconnect } = useSerial();

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
        return () => stopCamera();
    }, [stopCamera]);

    /**
     * LÓGICA DE DESCARTE AUTOMÁTICO (3 vías):
     * - Si se detecta Plástico → Verde (P) → +15 puntos
     * - Si se detecta Lata → Amarillo (L) → +20 puntos
     * - Si NO corresponde (o baja confianza) → Negro (C) → 0 puntos
     */
    const classifyWaste = (): ScanResult => {
        // Simulate detection: ~35% plastic, ~30% can, ~35% unidentified/other
        const roll = Math.random();
        const confidence = 0.70 + Math.random() * 0.28;

        if (roll < 0.35 && confidence >= 0.75) {
            // Identified as Plastic → Verde
            return { material: 'plastico', confidence, isRecyclable: true };
        } else if (roll < 0.65 && confidence >= 0.75) {
            // Identified as Can → Amarillo
            return { material: 'lata', confidence, isRecyclable: true };
        } else {
            // NOT identified as recyclable → auto-discard to Negro
            // Lower the confidence to signal uncertainty
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
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);

        setIsScanning(true);
        setScanResult(null);
        setSaved(false);

        setTimeout(() => {
            const result = classifyWaste();
            setScanResult(result);
            setIsScanning(false);

            // Send signal to Arduino immediately
            const binData = BIN_INFO[result.material];
            if (isConnected) {
                sendSignal(binData.serialChar);
            }

            // Save log to Supabase (points are 0 for comun)
            if (userId) {
                saveRecyclingLog(result.material, binData.points);
            }
        }, 1500 + Math.random() * 1000);
    };

    const saveRecyclingLog = async (material: BinType, points: number) => {
        try {
            // Insert the recycling log
            await supabase.from('recycling_logs').insert({
                user_id: userId,
                material,
                puntos_ganados: points,
            });

            // Only update profile points if recyclable (points > 0)
            if (points > 0) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('eco_puntos, total_scans')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({
                            eco_puntos: (profile.eco_puntos || 0) + points,
                            total_scans: (profile.total_scans || 0) + 1,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', userId);
                }
            } else {
                // For comun — still increment total_scans but NOT points
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('total_scans')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({
                            total_scans: (profile.total_scans || 0) + 1,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', userId);
                }
            }

            setSaved(true);
            onScanComplete?.(material, points);
        } catch {
            setSaved(false);
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setCapturedImage(null);
        setIsScanning(false);
        setSaved(false);
    };

    return (
        <div className="w-full max-w-lg mx-auto space-y-6">
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
            {serialError && (
                <p className="text-xs text-red-500 text-center">{serialError}</p>
            )}

            {/* Camera Viewfinder */}
            <div className="relative rounded-3xl overflow-hidden bg-gray-900 aspect-[4/3] shadow-xl">
                {!isStreaming && !capturedImage && (
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
                {isScanning && (
                    <div className="absolute inset-0 bg-black/30">
                        <div className="scan-line" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/60 text-white px-6 py-3 rounded-full text-sm font-medium animate-pulse">
                                🔍 Analizando residuo...
                            </div>
                        </div>
                    </div>
                )}

                {/* Corner brackets */}
                {isStreaming && !capturedImage && (
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
                {!isStreaming ? (
                    <Button onClick={startCamera} variant="primary" size="lg">
                        📷 Activar Cámara
                    </Button>
                ) : !capturedImage ? (
                    <>
                        <Button onClick={captureAndScan} variant="primary" size="lg">
                            🔍 Escanear
                        </Button>
                        <Button onClick={stopCamera} variant="ghost" size="lg">
                            ✕ Cerrar
                        </Button>
                    </>
                ) : (
                    <Button onClick={resetScan} variant="secondary" size="lg" disabled={isScanning}>
                        🔄 Nuevo Escaneo
                    </Button>
                )}
            </div>

            {/* Result Card */}
            {scanResult && (
                <div className={`rounded-3xl overflow-hidden border-2 ${BIN_INFO[scanResult.material].borderClass} shadow-lg`}>
                    {/* Header — Green/Amber for recyclable, Red-ish for discard */}
                    <div className={`p-6 text-white ${scanResult.isRecyclable
                            ? `bg-gradient-to-r ${BIN_INFO[scanResult.material].gradientClass}`
                            : 'bg-gradient-to-r from-gray-700 to-gray-900'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-90">
                                    {scanResult.isRecyclable ? '✅ Material Identificado' : '⚠️ No Identificado'}
                                </p>
                                <p className="text-2xl font-bold mt-1">{BIN_INFO[scanResult.material].label}</p>
                            </div>
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                                {BIN_INFO[scanResult.material].emoji}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 space-y-4">
                        {/* Discard message for non-recyclable */}
                        {!scanResult.isRecyclable && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                                <p className="text-sm text-amber-800 font-medium">
                                    ⚠️ Residuo no identificado como reciclable.
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    Por favor, deposítelo en el contenedor de <strong>Basura Común</strong> (Negro).
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Contenedor</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{BIN_INFO[scanResult.material].emoji}</span>
                                <span className="font-semibold text-eco-green-dark">
                                    {scanResult.material === 'plastico' ? 'Verde' : scanResult.material === 'lata' ? 'Amarillo' : 'Negro'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Confianza</span>
                            <span className={`font-semibold ${scanResult.isRecyclable ? 'text-eco-green-dark' : 'text-amber-600'}`}>
                                {(scanResult.confidence * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${scanResult.isRecyclable
                                        ? `bg-gradient-to-r ${BIN_INFO[scanResult.material].gradientClass}`
                                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    }`}
                                style={{ width: `${scanResult.confidence * 100}%` }}
                            />
                        </div>

                        {/* Points earned — only for recyclable */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Eco-Puntos</span>
                            {scanResult.isRecyclable ? (
                                <span className="font-bold text-eco-green-dark text-lg">
                                    +{BIN_INFO[scanResult.material].points} ⭐
                                </span>
                            ) : (
                                <span className="font-medium text-gray-400 text-sm">
                                    Sin puntos (no reciclable)
                                </span>
                            )}
                        </div>

                        {/* Arduino signal */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Señal Arduino</span>
                            <span className={`text-sm font-mono px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isConnected ? `✅ Enviado "${BIN_INFO[scanResult.material].serialChar}"` : '⚠️ No conectado'}
                            </span>
                        </div>

                        {saved && (
                            <p className="text-xs text-green-600 text-center mt-2 font-medium">
                                ✅ Registro guardado en tu historial
                            </p>
                        )}

                        <p className="text-xs text-gray-400 text-center">
                            ⚡ Clasificación por descarte • EcoScan AI UGB
                        </p>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center border border-red-100">
                    {error}
                </div>
            )}
        </div>
    );
}
