'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
    const { user, loading } = useAuth();

    if (!loading && user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        }
        return null;
    }

    return (
        <main className="min-h-screen bg-white">
            {/* ============================================
                HERO — Dark, Observatorio Verde Style
               ============================================ */}
            <section className="relative bg-black pt-16 overflow-hidden">
                {/* Background image collage simulation */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 grid grid-cols-4 gap-0.5">
                        <div className="bg-gradient-to-br from-green-900 to-green-700" />
                        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600" />
                        <div className="bg-gradient-to-br from-green-700 to-teal-600" />
                        <div className="bg-gradient-to-br from-teal-800 to-green-700" />
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/60" />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
                    <div className="max-w-3xl page-enter">
                        <p className="text-eco-emerald text-sm sm:text-base font-medium tracking-wide uppercase mb-4">
                            Universidad Gerardo Barrios
                        </p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
                            Observatorio{' '}
                            <span className="text-eco-emerald">Verde</span>{' '}
                            UGB
                        </h1>
                        <p className="text-lg sm:text-xl text-white/60 max-w-xl mb-8 leading-relaxed">
                            Descubre lo mejor del reciclaje inteligente. Escanea residuos con IA,
                            gana eco-puntos y contribuye a un campus sustentable.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/register">
                                <Button variant="primary" size="lg">
                                    Escanear Ahora
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="secondary" size="lg" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">
                                    Iniciar Sesión →
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Green bar divider — like Observatorio Verde */}
                <div className="h-1.5 bg-eco-emerald" />
            </section>

            {/* ============================================
                3 BINS — Clean white
               ============================================ */}
            <section className="py-16 sm:py-20 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            3 Contenedores, Cero Confusión
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Nuestro sistema clasifica residuos en 3 categorías y abre automáticamente
                            la compuerta correcta del contenedor inteligente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Verde */}
                        <Card className="group text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                🟢
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Verde</h3>
                            <p className="text-sm font-medium text-green-600 mb-2">Botellas de Plástico</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Botellas PET y envases plásticos. Señal Arduino: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">P</code>
                            </p>
                            <div className="text-xl font-bold text-green-600">+15 ⭐</div>
                        </Card>

                        {/* Amarillo */}
                        <Card className="group text-center">
                            <div className="w-16 h-16 bg-amber-400 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                🟡
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Amarillo</h3>
                            <p className="text-sm font-medium text-amber-600 mb-2">Latas de Aluminio</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Latas de aluminio y conserva. Señal Arduino: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">L</code>
                            </p>
                            <div className="text-xl font-bold text-amber-600">+20 ⭐</div>
                        </Card>

                        {/* Negro */}
                        <Card className="group text-center">
                            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                ⚫
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Negro</h3>
                            <p className="text-sm font-medium text-gray-600 mb-2">Basura Común</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Descarte automático para no-reciclables. Señal Arduino: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">C</code>
                            </p>
                            <div className="text-sm font-medium text-gray-400">Sin puntos</div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ============================================
                HOW IT WORKS — Light gray bg
               ============================================ */}
            <section className="py-16 sm:py-20 px-4 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            ¿Cómo funciona?
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { step: '1', icon: '📷', title: 'Escanea', desc: 'Apunta tu cámara al residuo' },
                            { step: '2', icon: '🤖', title: 'IA Clasifica', desc: 'La IA identifica el material' },
                            { step: '3', icon: '⚙️', title: 'Arduino Abre', desc: 'Se abre la compuerta correcta' },
                            { step: '4', icon: '⭐', title: 'Gana Puntos', desc: 'Plástico y latas suman puntos' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-14 h-14 bg-black text-white rounded-lg flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
                                    {item.icon}
                                </div>
                                <div className="text-[10px] font-bold text-eco-emerald uppercase tracking-wider mb-1">
                                    Paso {item.step}
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
                CTA — Dark emerald
               ============================================ */}
            <section className="py-16 sm:py-20 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-black rounded-lg p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-eco-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                                Únete al reciclaje inteligente
                            </h2>
                            <p className="text-white/50 max-w-xl mx-auto mb-8">
                                Gana eco-puntos, canjea cupones en la UGB Store y contribuye a un campus más limpio.
                            </p>
                            <Link href="/register">
                                <Button variant="primary" size="lg">
                                    Crear Cuenta Gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                FOOTER — Dark
               ============================================ */}
            <footer className="bg-black text-white py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Green bar */}
                    <div className="h-1 bg-eco-emerald rounded-full mb-6" />
                    <div className="text-center">
                        <p className="text-sm text-white/60 max-w-md mx-auto">
                            © Copyright <strong className="text-white">Universidad Gerardo Barrios</strong>. All Rights Reserved.
                        </p>
                        <p className="text-xs text-white/30 mt-2">
                            EcoScan AI V3.0 — Observatorio Verde · Institutional Edition
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
