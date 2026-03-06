'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { supabase } = await import('@/lib/supabase');
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('Error al conectar. Verifica tu configuración de Supabase.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-eco-green-dark mb-1">Bienvenido de vuelta</h2>
            <p className="text-sm text-eco-gray mb-6">Inicia sesión en EcoScan AI UGB ♻️</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@ugb.edu.sv"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                    Iniciar Sesión
                </Button>
            </form>

            <p className="text-center text-sm text-eco-gray mt-6">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-eco-green-dark font-medium hover:underline">
                    Regístrate aquí
                </Link>
            </p>
        </div>
    );
}
