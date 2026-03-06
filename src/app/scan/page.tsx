'use client';

import React from 'react';
import { useAuth } from '@/lib/useAuth';
import CameraScanner from '@/components/CameraScanner';
import { BIN_INFO } from '@/lib/supabase';

export default function ScanPage() {
    const { user, loading, refreshProfile } = useAuth();

    if (!loading && !user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 px-3 sm:px-4">
                <div className="max-w-4xl mx-auto pt-4 space-y-4">
                    <div className="h-6 w-32 eco-skeleton rounded-full mx-auto" />
                    <div className="h-8 w-64 eco-skeleton rounded-lg mx-auto" />
                    <div className="aspect-[3/4] sm:aspect-[4/3] max-w-lg mx-auto eco-skeleton rounded-3xl" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-eco-cream pt-20 sm:pt-24 pb-8 sm:pb-16 px-3 sm:px-4 safe-bottom">
            <div className="max-w-4xl mx-auto page-enter">
                {/* Header — compact on mobile */}
                <div className="text-center mb-6 sm:mb-10">
                    <div className="inline-flex items-center gap-2 bg-eco-green-dark/5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm text-eco-green-dark font-medium mb-3 sm:mb-4">
                        <span>🔍</span> Identificador IA
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-eco-green-dark mb-2 sm:mb-3">
                        Escanea tu Residuo
                    </h1>
                    <p className="text-sm sm:text-base text-eco-gray max-w-md mx-auto">
                        Apunta la cámara al objeto y nuestra IA lo clasificará en el contenedor correcto
                    </p>
                </div>

                {/* Scanner — expands on mobile */}
                <CameraScanner
                    userId={user?.id}
                    onScanComplete={() => refreshProfile()}
                />

                {/* 3 Bins Guide — horizontal scroll on mobile */}
                <section className="mt-10 sm:mt-16">
                    <h2 className="text-lg sm:text-xl font-bold text-eco-green-dark mb-4 sm:mb-6 text-center">
                        Guía de Contenedores
                    </h2>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {Object.entries(BIN_INFO).map(([key, bin]) => (
                            <div
                                key={key}
                                className="eco-glass-card rounded-2xl p-3 sm:p-5 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 ${bin.color} rounded-lg sm:rounded-xl mb-2 sm:mb-3 flex items-center justify-center text-white text-lg sm:text-2xl shadow-sm mx-auto`}>
                                    {bin.emoji}
                                </div>
                                <h3 className="font-bold text-eco-green-dark text-xs sm:text-base mb-0.5 sm:mb-1">{bin.label}</h3>
                                <p className="text-[10px] sm:text-xs text-eco-gray mb-1 sm:mb-2">
                                    Señal: <code className="bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-xs">{bin.serialChar}</code>
                                </p>
                                <div className="text-sm sm:text-lg font-bold text-eco-green-dark">
                                    {bin.points > 0 ? `+${bin.points} ⭐` : 'Sin puntos'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
