'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function HomePage() {
    const { user, loading } = useAuth();

    // If user is logged in, redirect to dashboard
    if (!loading && user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        }
        return null;
    }

    return (
        <main className="min-h-screen bg-eco-cream">
            {/* Hero Section */}
            <section className="relative pt-28 pb-20 px-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-eco-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-eco-green-light/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="max-w-6xl mx-auto relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="page-enter">
                            <div className="inline-flex items-center gap-2 bg-eco-green-dark/5 px-4 py-1.5 rounded-full text-sm text-eco-green-dark font-medium mb-6">
                                <span className="w-2 h-2 bg-eco-green rounded-full animate-pulse" />
                                Universidad Gerardo Barrios
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-eco-green-dark leading-tight mb-6">
                                Recicla de forma{' '}
                                <span className="eco-text-gradient">inteligente</span>{' '}
                                con EcoScan
                            </h1>
                            <p className="text-lg text-eco-gray max-w-lg mb-8 leading-relaxed">
                                Escanea residuos con tu cámara, clasifícalos automáticamente y gana
                                eco-puntos canjeables en la UGB Store. Conectado a contenedores inteligentes con Arduino.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/register">
                                    <Button variant="primary" size="lg">
                                        🚀 Comenzar Ahora
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="secondary" size="lg">
                                        Iniciar Sesión →
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Hero visual */}
                        <div className="relative flex justify-center">
                            <div className="w-72 h-72 md:w-80 md:h-80 bg-gradient-to-br from-eco-green-dark to-eco-green rounded-[3rem] shadow-2xl shadow-eco-green/20 flex items-center justify-center animate-float">
                                <div className="text-center text-white">
                                    <div className="text-7xl mb-4">♻️</div>
                                    <p className="text-xl font-bold">EcoScan AI</p>
                                    <p className="text-sm opacity-80 mt-1">UGB</p>
                                </div>
                            </div>
                            {/* Floating badges */}
                            <div className="absolute top-4 -left-4 bg-white rounded-2xl shadow-lg p-4 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">⭐</span>
                                    <div>
                                        <p className="text-xs text-eco-gray">Eco-Puntos</p>
                                        <p className="text-sm font-bold text-eco-green-dark">Gana y Canjea</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🤖</span>
                                    <div>
                                        <p className="text-xs text-eco-gray">Arduino</p>
                                        <p className="text-sm font-bold text-eco-green-dark">Conectado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3 Bins Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-eco-green-dark mb-4">
                            3 Contenedores, Cero Confusión
                        </h2>
                        <p className="text-eco-gray max-w-2xl mx-auto">
                            Nuestro sistema clasifica residuos en 3 categorías y abre automáticamente
                            la compuerta correcta del contenedor inteligente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Verde - Plástico */}
                        <Card className="group text-center">
                            <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-green-500/20 transition-transform duration-300 group-hover:scale-110">
                                🟢
                            </div>
                            <h3 className="text-xl font-bold text-eco-green-dark mb-2">Verde</h3>
                            <p className="text-lg font-medium text-green-600 mb-3">Botellas de Plástico</p>
                            <p className="text-sm text-eco-gray">
                                Botellas PET, envases plásticos y similares. Señal Arduino: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">P</code>
                            </p>
                            <div className="mt-4 text-2xl font-bold text-green-600">+15 ⭐</div>
                        </Card>

                        {/* Amarillo - Latas */}
                        <Card className="group text-center">
                            <div className="w-20 h-20 bg-amber-400 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-amber-400/20 transition-transform duration-300 group-hover:scale-110">
                                🟡
                            </div>
                            <h3 className="text-xl font-bold text-eco-green-dark mb-2">Amarillo</h3>
                            <p className="text-lg font-medium text-amber-600 mb-3">Latas</p>
                            <p className="text-sm text-eco-gray">
                                Latas de aluminio, latas de conserva y similares. Señal Arduino: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">L</code>
                            </p>
                            <div className="mt-4 text-2xl font-bold text-amber-600">+20 ⭐</div>
                        </Card>

                        {/* Negro - Común */}
                        <Card className="group text-center">
                            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-gray-800/20 transition-transform duration-300 group-hover:scale-110">
                                ⚫
                            </div>
                            <h3 className="text-xl font-bold text-eco-green-dark mb-2">Negro</h3>
                            <p className="text-lg font-medium text-gray-700 mb-3">Basura Común</p>
                            <p className="text-sm text-eco-gray">
                                Todo lo que no sea plástico ni lata se clasifica aquí por descarte automático. Señal Arduino: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">C</code>
                            </p>
                            <div className="mt-4 text-sm font-medium text-gray-400">Sin puntos (descarte)</div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-eco-green-dark mb-4">
                            ¿Cómo funciona?
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { step: '1', icon: '📷', title: 'Escanea', desc: 'Apunta tu cámara al residuo' },
                            { step: '2', icon: '🤖', title: 'IA Clasifica', desc: 'La IA identifica el material' },
                            { step: '3', icon: '🔌', title: 'Arduino Abre', desc: 'Se abre la compuerta correcta' },
                            { step: '4', icon: '⭐', title: 'Gana Puntos', desc: 'Solo plástico y latas suman puntos' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 bg-eco-green-dark text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                                    {item.icon}
                                </div>
                                <div className="text-xs font-bold text-eco-green uppercase mb-1">Paso {item.step}</div>
                                <h3 className="font-bold text-eco-green-dark mb-1">{item.title}</h3>
                                <p className="text-sm text-eco-gray">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="eco-gradient rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 left-8 text-6xl">🌿</div>
                            <div className="absolute bottom-4 right-8 text-6xl">♻️</div>
                        </div>
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Únete al reciclaje inteligente en UGB
                            </h2>
                            <p className="text-white/80 max-w-xl mx-auto mb-8">
                                Gana eco-puntos, canjea cupones y contribuye a un campus más limpio
                            </p>
                            <Link href="/register">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="!bg-white !text-eco-green-dark hover:!bg-gray-50"
                                >
                                    Crear Cuenta Gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-eco-green-dark text-white py-10 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🌿</span>
                        </div>
                        <span className="text-lg font-bold">EcoScan AI — UGB</span>
                    </div>
                    <p className="text-sm text-white/60 max-w-md mx-auto">
                        Proyecto de Tecnología Emergente — Universidad Gerardo Barrios. Reciclaje inteligente con visión artificial y Arduino.
                    </p>
                    <div className="border-t border-white/10 mt-6 pt-4 text-xs text-white/40">
                        © 2026 EcoScan AI UGB. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </main>
    );
}
