import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
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
    const baseClasses =
        'inline-flex items-center justify-center font-medium transition-all duration-200 select-none active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<string, string> = {
        primary:
            'bg-eco-emerald text-white hover:bg-eco-emerald-dark shadow-sm hover:shadow-md rounded-md',
        secondary:
            'bg-white text-eco-green-dark border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-md',
        outline:
            'border border-eco-emerald text-eco-emerald hover:bg-eco-emerald hover:text-white rounded-md',
        ghost:
            'text-eco-gray hover:text-eco-green-dark hover:bg-gray-100 rounded-md',
        danger:
            'bg-red-500 text-white hover:bg-red-600 shadow-sm rounded-md',
    };

    const sizes: Record<string, string> = {
        sm: 'text-xs px-3 py-1.5 min-h-[32px]',
        md: 'text-sm px-4 py-2 min-h-[40px]',
        lg: 'text-base px-6 py-3 min-h-[48px]',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    Cargando...
                </span>
            ) : (
                children
            )}
        </button>
    );
}
