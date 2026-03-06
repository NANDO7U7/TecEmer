import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
    children,
    className = '',
    hover = true,
    glass = false,
    padding = 'md',
}: CardProps) {
    const paddings: Record<string, string> = {
        none: '',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-6',
        lg: 'p-5 sm:p-8',
    };

    const baseClass = glass
        ? 'eco-glass-card rounded-2xl transition-all duration-300'
        : 'bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300';

    return (
        <div
            className={`${baseClass} ${hover ? 'hover:shadow-md hover:-translate-y-1' : ''
                } ${paddings[padding]} ${className}`}
        >
            {children}
        </div>
    );
}
