'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Faculty {
    id: string;
    name: string;
    emoji: string;
}

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [carnet, setCarnet] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch faculties on mount
    useEffect(() => {
        async function loadFaculties() {
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data, error: dbError } = await supabase
                    .from('faculties')
                    .select('id, name, emoji')
                    .order('name', { ascending: true });
                
                if (dbError) throw dbError;
                if (data) setFaculties(data);
            } catch (err: any) {
                console.error('Error al cargar facultades:', err);
            }
        }
        loadFaculties();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Carnet Validation: UGB pattern SMSS141122
        const carnetClean = carnet.toUpperCase().replace(/\s/g, '');
        const carnetRegex = /^[A-Z]{2,5}\d{4,8}$/;
        if (!carnetRegex.test(carnetClean)) {
            setError('Formato de carnet no válido. Ej: SMIS098722 (letras seguidas de números).');
            setIsLoading(false);
            return;
        }

        if (!facultyId) {
            setError('Por favor, selecciona tu facultad.');
            setIsLoading(false);
            return;
        }

        try {
            const { supabase } = await import('@/lib/supabase');
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { 
                        full_name: fullName,
                        name: fullName, // Compatibilidad con columna 'name'
                        carnet: carnetClean,
                        faculty_id: facultyId
                    },
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
                    Revisa tu correo para confirmar tu cuenta y empezar a reciclar.
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
                    <label htmlFor="carnet" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Código de Carnet UGB
                    </label>
                    <input
                        id="carnet"
                        type="text"
                        value={carnet}
                        onChange={(e) => setCarnet(e.target.value)}
                        required
                        placeholder="SMIS098722"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all"
                    />
                </div>

                <div>
                    <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Facultad
                    </label>
                    <select
                        id="faculty"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-eco-green/30 focus:border-eco-green transition-all bg-white"
                    >
                        <option value="">-- Selecciona tu Facultad --</option>
                        {faculties.map((fac) => (
                            <option key={fac.id} value={fac.id}>
                                {fac.emoji} {fac.name}
                            </option>
                        ))}
                    </select>
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
