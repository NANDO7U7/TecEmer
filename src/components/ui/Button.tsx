'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eco-green';

    const variants: Record<string, string> = {
        primary:
            'bg-eco-green-dark text-white hover:bg-eco-green hover:shadow-lg hover:shadow-eco-green/25 hover:scale-[1.03] active:scale-[0.98]',
        secondary:
            'bg-eco-cream text-eco-green-dark border border-eco-green/20 hover:bg-white hover:border-eco-green hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        outline:
            'bg-transparent text-eco-green-dark border-2 border-eco-green-dark hover:bg-eco-green-dark hover:text-white hover:scale-[1.03] active:scale-[0.98]',
        ghost:
            'bg-transparent text-eco-green-dark hover:bg-eco-green-dark/5 hover:scale-[1.02] active:scale-[0.98]',
    };

    const sizes: Record<string, string> = {
        sm: 'px-4 py-2 text-sm gap-1.5',
        md: 'px-6 py-2.5 text-sm gap-2',
        lg: 'px-8 py-3 text-base gap-2.5',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                } ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}
