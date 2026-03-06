import React from 'react';

interface StatCardProps {
    value: string;
    label: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
}

export default function StatCard({
    value,
    label,
    icon,
    trend = 'neutral',
    trendValue,
    color = 'bg-eco-green-dark',
}: StatCardProps) {
    const trendColors: Record<string, string> = {
        up: 'text-green-500',
        down: 'text-red-500',
        neutral: 'text-gray-400',
    };

    const trendIcons: Record<string, string> = {
        up: '↑',
        down: '↓',
        neutral: '→',
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
            <div className="flex items-start justify-between mb-4">
                <div
                    className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-lg transition-transform duration-300 group-hover:scale-110`}
                >
                    {icon || '📊'}
                </div>
                {trendValue && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
                        <span>{trendIcons[trend]}</span>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-bold text-eco-green-dark">{value}</p>
                <p className="text-sm text-eco-gray">{label}</p>
            </div>
        </div>
    );
}
