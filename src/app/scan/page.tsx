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
            <main className="min-h-screen bg-eco-cream pt-24 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-eco-green border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-eco-cream pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto page-enter">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-eco-green-dark/5 px-4 py-1.5 rounded-full text-sm text-eco-green-dark font-medium mb-4">
                        <span>🔍</span> Identificador IA
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-eco-green-dark mb-3">
                        Escanea tu Residuo
                    </h1>
                    <p className="text-eco-gray max-w-md mx-auto">
                        Apunta la cámara al objeto y nuestra IA lo clasificará en el contenedor correcto
                    </p>
                </div>

                {/* Scanner */}
                <CameraScanner
                    userId={user?.id}
                    onScanComplete={() => refreshProfile()}
                />

                {/* 3 Bins Guide */}
                <section className="mt-16">
                    <h2 className="text-xl font-bold text-eco-green-dark mb-6 text-center">
                        Guía de Contenedores
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(BIN_INFO).map(([key, bin]) => (
                            <div
                                key={key}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center"
                            >
                                <div className={`w-14 h-14 ${bin.color} rounded-xl mb-3 flex items-center justify-center text-white text-2xl shadow-sm mx-auto`}>
                                    {bin.emoji}
                                </div>
                                <h3 className="font-bold text-eco-green-dark mb-1">{bin.label}</h3>
                                <p className="text-xs text-eco-gray mb-2">
                                    Señal: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{bin.serialChar}</code>
                                </p>
                                <div className="text-lg font-bold text-eco-green-dark">+{bin.points} ⭐</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
