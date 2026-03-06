import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
    children,
    className = '',
    hover = true,
    padding = 'md',
}: CardProps) {
    const paddings: Record<string, string> = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 ${hover ? 'hover:shadow-md hover:-translate-y-1' : ''
                } ${paddings[padding]} ${className}`}
        >
            {children}
        </div>
    );
}
