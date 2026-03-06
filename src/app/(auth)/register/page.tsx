'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { supabase } = await import('@/lib/supabase');
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });

            if (authError) {
                setError(authError.message);
            } else {
                setSuccess(true);
            }
        } catch {
            setError('Error al conectar. Verifica tu configuración de Supabase.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-eco-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-eco-green-dark mb-2">¡Registro exitoso!</h2>
                <p className="text-sm text-eco-gray mb-6">
                    Revisa tu correo para confirmar tu cuenta.
                </p>
                <Link href="/login">
                    <Button variant="primary">Ir a Iniciar Sesión</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-eco-green-dark mb-1">Crear cuenta</h2>
            <p className="text-sm text-eco-gray mb-6">Únete a EcoScan AI en la UGB 🌍</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nombre completo
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Juan Pérez"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all"
                    />
                </div>

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
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                    Crear Cuenta
                </Button>
            </form>

            <p className="text-center text-sm text-eco-gray mt-6">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-eco-green-dark font-medium hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
