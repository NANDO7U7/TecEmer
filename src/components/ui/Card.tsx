import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    glass?: boolean;
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = true,
    glass = false,
}: CardProps) {
    const paddings: Record<string, string> = {
        none: '',
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
    };

    const base = glass
        ? 'eco-glass-card rounded-lg'
        : 'bg-white rounded-lg border border-gray-200 shadow-sm';

    const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-300' : '';

    return (
        <div className={`${base} ${hoverClass} ${paddings[padding]} ${className}`}>
            {children}
        </div>
    );
}
