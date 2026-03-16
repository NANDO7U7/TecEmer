'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useIdentity, IdentifiedUser } from '@/lib/useIdentity';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface IdentityScannerProps {
    onIdentified: (user: IdentifiedUser) => void;
    onSkip?: () => void;
}

export default function IdentityScanner({ onIdentified, onSkip }: IdentityScannerProps) {
    const { status, identifiedUser, error, identifyByCode, identifyFromText, reset } = useIdentity();
    const [mode, setMode] = useState<'consent' | 'camera' | 'manual' | 'result'>('consent');
    const [manualCode, setManualCode] = useState('');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            cameraStream?.getTracks().forEach((t) => t.stop());
        };
    }, [cameraStream]);

    // When matched, notify parent
    useEffect(() => {
        if (status === 'matched' && identifiedUser) {
            setMode('result');
            // Auto-proceed after showing the result
            const timer = setTimeout(() => {
                onIdentified(identifiedUser);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [status, identifiedUser, onIdentified]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setCameraStream(stream);
            setMode('camera');
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch {
            setMode('manual');
        }
    }, []);

    const captureAndScan = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        // Stop camera
        cameraStream?.getTracks().forEach((t) => t.stop());

        // Simulate OCR: in production, this would use Tesseract.js or a cloud OCR API.
        // For demo, we prompt the user to enter the code they see on the carnet.
        setMode('manual');
    }, [cameraStream]);

    const handleManualSubmit = useCallback(async () => {
        if (!manualCode.trim()) return;
        await identifyByCode(manualCode.trim());
    }, [manualCode, identifyByCode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleManualSubmit();
    };

    // CONSENT SCREEN
    if (mode === 'consent') {
        return (
            <Card glass className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 eco-gradient rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 shadow-lg shadow-eco-green/20">
                    🪪
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-eco-green-dark mb-2">
                    Identificación de Estudiante
                </h2>
                <p className="text-sm text-eco-gray mb-6 max-w-sm mx-auto">
                    EcoScan AI solicita permiso para usar la cámara y escanear tu carnet UGB.
                    <span className="block mt-2 text-xs text-eco-green-dark/60">
                        🔒 Tus datos están protegidos y no se almacenan imágenes.
                    </span>
                </p>

                <div className="space-y-3">
                    <Button onClick={startCamera} variant="primary" size="lg" className="w-full">
                        📷 Escanear Carnet con Cámara
                    </Button>
                    <Button
                        onClick={() => setMode('manual')}
                        variant="outline"
                        size="md"
                        className="w-full"
                    >
                        ⌨️ Ingresar Código Manual
                    </Button>
                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="text-xs text-eco-gray hover:text-eco-green-dark transition-colors mt-2"
                        >
                            Continuar sin identificación →
                        </button>
                    )}
                </div>
            </Card>
        );
    }

    // CAMERA SCAN
    if (mode === 'camera') {
        return (
            <div className="max-w-md mx-auto animate-scale-in">
                <Card glass padding="sm">
                    <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3]">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {/* Scan overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[80%] h-[50%] border-2 border-white/50 rounded-xl relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-eco-green rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-eco-green rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-eco-green rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-eco-green rounded-br-lg" />
                                <div className="scan-line" />
                            </div>
                        </div>
                        {/* Instructions */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <p className="text-white text-sm text-center font-medium">
                                Coloca el carnet dentro del recuadro
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                        <Button
                            onClick={captureAndScan}
                            variant="primary"
                            size="lg"
                            className="flex-1"
                        >
                            📸 Capturar
                        </Button>
                        <Button
                            onClick={() => {
                                cameraStream?.getTracks().forEach((t) => t.stop());
                                setMode('manual');
                            }}
                            variant="outline"
                            size="lg"
                        >
                            ⌨️
                        </Button>
                    </div>
                </Card>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        );
    }

    // MANUAL CODE ENTRY
    if (mode === 'manual') {
        return (
            <div className="max-w-md mx-auto animate-scale-in">
                <Card glass>
                    {capturedImage && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                            <img
                                src={capturedImage}
                                alt="Captura del carnet"
                                className="w-full h-32 object-cover opacity-60"
                            />
                            <p className="text-center text-xs text-eco-gray py-1 bg-gray-50">
                                Imagen capturada — ingresa el código que ves en tu carnet
                            </p>
                        </div>
                    )}

                    <div className="text-center mb-4">
                        <span className="text-4xl mb-2 block">🪪</span>
                        <h3 className="font-bold text-eco-green-dark">Código de Carnet UGB</h3>
                        <p className="text-xs text-eco-gray mt-1">
                            Ingresa el código impreso en tu carnet (ej: SMSS141122)
                        </p>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            onKeyDown={handleKeyDown}
                            placeholder="SMSS141122"
                            maxLength={12}
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-center font-mono text-lg tracking-wider uppercase focus:outline-none focus:border-eco-green focus:ring-2 focus:ring-eco-green/20 transition-colors"
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleManualSubmit}
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={!manualCode.trim() || status === 'scanning'}
                        isLoading={status === 'scanning'}
                    >
                        🔍 Buscar Estudiante
                    </Button>

                    {error && (
                        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-center animate-fade-in">
                            <p className="text-sm text-red-700">{error}</p>
                            <button
                                onClick={() => { reset(); setManualCode(''); }}
                                className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between mt-4">
                        <button
                            onClick={() => { setCapturedImage(null); setMode('consent'); reset(); }}
                            className="text-xs text-eco-gray hover:text-eco-green-dark transition-colors"
                        >
                            ← Volver
                        </button>
                        {onSkip && (
                            <button
                                onClick={onSkip}
                                className="text-xs text-eco-gray hover:text-eco-green-dark transition-colors"
                            >
                                Continuar sin ID →
                            </button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // RESULT — identified student
    if (mode === 'result' && identifiedUser) {
        return (
            <div className="max-w-md mx-auto animate-scale-in">
                <Card glass className="text-center">
                    {/* Success Animation */}
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full eco-gradient flex items-center justify-center text-4xl shadow-lg shadow-eco-green/30 animate-count-up">
                        ✅
                    </div>

                    <h3 className="text-xl font-bold text-eco-green-dark mb-1">
                        ¡Estudiante Identificado!
                    </h3>

                    <div className="bg-eco-cream/70 rounded-xl p-4 mt-3 space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-eco-green/10 flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-eco-green-dark">
                                    {identifiedUser.full_name || 'Estudiante UGB'}
                                </p>
                                <p className="text-xs text-eco-gray font-mono">
                                    🪪 {identifiedUser.carnet_code}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 pt-2 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-lg font-bold text-eco-green-dark animate-count-up">
                                    {identifiedUser.eco_puntos} ⭐
                                </p>
                                <p className="text-[10px] text-eco-gray">Eco-Puntos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-eco-green-dark">
                                    {identifiedUser.total_scans}
                                </p>
                                <p className="text-[10px] text-eco-gray">Escaneos</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-eco-gray mt-3 animate-pulse">
                        Cargando escáner de reciclaje...
                    </p>
                </Card>
            </div>
        );
    }

    return null;
}
