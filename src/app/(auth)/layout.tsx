import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-eco-cream flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-12 h-12 eco-gradient rounded-2xl flex items-center justify-center">
                            <span className="text-white text-2xl">🌿</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-eco-green-dark">
                        Eco<span className="text-eco-green">Scan</span> AI
                    </h1>
                    <p className="text-sm text-eco-gray mt-1">Universidad Gerardo Barrios</p>
                </div>
                {children}
            </div>
        </div>
    );
}
