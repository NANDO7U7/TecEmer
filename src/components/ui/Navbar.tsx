'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Button from './Button';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, loading, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    const publicLinks = [
        { href: '/', label: 'Inicio', icon: '🏠' },
    ];

    const authLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/scan', label: 'Escanear', icon: '📷' },
    ];

    const navLinks = user ? authLinks : publicLinks;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 eco-glass safe-top">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
                        <div className="w-9 h-9 eco-gradient rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <span className="text-white text-lg">🌿</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-eco-green-dark leading-tight">
                                Eco<span className="text-eco-green">Scan</span>
                            </span>
                            <span className="text-[10px] font-medium text-eco-gray leading-tight -mt-0.5">UGB</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-full transition-all duration-300 hover:text-eco-green-dark hover:bg-eco-green-dark/5"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons (Desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        {loading ? (
                            <div className="w-24 h-10 eco-skeleton rounded-full" />
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-eco-gray hidden lg:inline">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </span>
                                <Button onClick={handleSignOut} variant="outline" size="sm">
                                    🚪 Cerrar Sesión
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="outline" size="sm">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm">
                                        Registrarse
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button — 48px touch target */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        aria-label="Abrir menú"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu — full slide-down with touch-friendly items */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-4 pb-4 pt-2 space-y-1 bg-white/95 backdrop-blur-xl border-t border-gray-100 animate-slide-down">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-4 text-base font-medium text-gray-700 rounded-2xl hover:bg-eco-green-dark/5 hover:text-eco-green-dark transition-colors active:bg-eco-green-dark/10"
                        >
                            <span className="text-xl">{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2" />

                    <div className="space-y-2">
                        {loading ? (
                            <div className="h-12 eco-skeleton rounded-full" />
                        ) : user ? (
                            <>
                                <div className="px-4 py-2 text-sm text-eco-gray">
                                    👤 {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </div>
                                <Button onClick={handleSignOut} variant="outline" size="lg" className="w-full">
                                    🚪 Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" size="lg" className="w-full">
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="primary" size="lg" className="w-full">
                                        Registrarse
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
