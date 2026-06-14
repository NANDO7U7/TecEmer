'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Button from './Button';

export default function Navbar() {
    const { user, profile, loading, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    return (
        <>
            {/* Top bar — dark, matching Observatorio Verde */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 bg-eco-emerald rounded-lg flex items-center justify-center shadow-md shadow-eco-emerald/20 transition-transform group-hover:scale-105">
                                <span className="text-white text-sm font-bold">UGB</span>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-white text-sm font-bold leading-tight">EcoScan AI</p>
                                <p className="text-white/50 text-[10px] leading-tight">Observatorio Verde</p>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {user ? (
                                <>
                                    <Link href="/scan" className="px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                        Escanear
                                    </Link>
                                    {profile?.is_admin && (
                                        <>
                                            <Link href="/admin" className="px-3 py-2 text-sm text-eco-emerald font-semibold hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                                Admin
                                            </Link>
                                            <Link href="/store-admin" className="px-3 py-2 text-sm text-eco-emerald font-semibold hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                                Caja Store
                                            </Link>
                                        </>
                                    )}
                                    <div className="w-px h-5 bg-white/10 mx-2" />
                                    
                                    {/* Perfil Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-all font-medium focus:outline-none"
                                        >
                                            <span>👤 Perfil</span>
                                            <svg 
                                                className={`w-3 h-3 text-white/40 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {profileDropdownOpen && (
                                            <>
                                                {/* Backdrop to close dropdown */}
                                                <div 
                                                    className="fixed inset-0 z-40 cursor-default" 
                                                    onClick={() => setProfileDropdownOpen(false)} 
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-slide-down">
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setProfileDropdownOpen(false)}
                                                        className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                                    >
                                                        👤 Mi Panel
                                                    </Link>
                                                    <Link
                                                        href="/dashboard?edit=true"
                                                        onClick={() => setProfileDropdownOpen(false)}
                                                        className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium"
                                                    >
                                                        ✏️ Editar Perfil
                                                    </Link>
                                                    <div className="h-px bg-white/10 my-1" />
                                                    <button
                                                        onClick={() => {
                                                            setProfileDropdownOpen(false);
                                                            signOut();
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        🚪 Cerrar Sesión
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : loading ? (
                                <div className="flex gap-2">
                                    <div className="h-8 w-20 eco-skeleton rounded-md" />
                                    <div className="h-8 w-28 eco-skeleton rounded-md" />
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                                        Iniciar Sesión
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="primary" size="sm">
                                            Escanear Ahora
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </nav>
 
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                            aria-label="Menú"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
 
                    {/* Mobile Menu */}
                    {menuOpen && (
                        <div className="md:hidden border-t border-white/10 py-3 animate-slide-down">
                            {user ? (
                                <div className="space-y-1">
                                    <Link href="/scan" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-md">
                                        📷 Escanear
                                    </Link>
                                    {profile?.is_admin && (
                                        <>
                                            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-eco-emerald font-semibold hover:text-white hover:bg-white/5 rounded-md">
                                                ⚙️ Panel Admin
                                            </Link>
                                            <Link href="/store-admin" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-eco-emerald font-semibold hover:text-white hover:bg-white/5 rounded-md">
                                                🏪 Caja UGB Store
                                            </Link>
                                        </>
                                    )}
                                    <div className="h-px bg-white/10 my-2" />
                                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-md">
                                        👤 Perfil
                                    </Link>
                                    <Link href="/dashboard?edit=true" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-md">
                                        ✏️ Editar Perfil
                                    </Link>
                                    <button
                                        onClick={() => { signOut(); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-md"
                                    >
                                        🚪 Cerrar Sesión
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-md">
                                        Iniciar Sesión
                                    </Link>
                                    <Link href="/register" onClick={() => setMenuOpen(false)}>
                                        <Button variant="primary" size="md" className="w-full">
                                            Escanear Ahora
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}
