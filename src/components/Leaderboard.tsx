'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';

interface Faculty {
    id: string;
    name: string;
    short_name: string;
    color: string;
    emoji: string;
}

interface FacultyRanking extends Faculty {
    total_points: number;
    total_scans: number;
    member_count: number;
}

export default function Leaderboard() {
    const [rankings, setRankings] = useState<FacultyRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        setLoading(true);

        // Get all faculties
        const { data: faculties } = await supabase
            .from('faculties')
            .select('*');

        if (!faculties) {
            setLoading(false);
            return;
        }

        // Get aggregated stats per faculty
        const { data: profiles } = await supabase
            .from('profiles')
            .select('faculty_id, eco_puntos, total_scans');

        const stats: Record<string, { points: number; scans: number; members: number }> = {};
        (profiles || []).forEach((p) => {
            if (!p.faculty_id) return;
            if (!stats[p.faculty_id]) stats[p.faculty_id] = { points: 0, scans: 0, members: 0 };
            stats[p.faculty_id].points += p.eco_puntos || 0;
            stats[p.faculty_id].scans += p.total_scans || 0;
            stats[p.faculty_id].members += 1;
        });

        const ranked = faculties
            .map((f) => ({
                ...f,
                total_points: stats[f.id]?.points || 0,
                total_scans: stats[f.id]?.scans || 0,
                member_count: stats[f.id]?.members || 0,
            }))
            .sort((a, b) => b.total_points - a.total_points);

        setRankings(ranked);
        setLoading(false);
    };

    const medals = ['🥇', '🥈', '🥉'];

    if (loading) {
        return (
            <Card>
                <div className="space-y-3">
                    <div className="h-6 w-48 eco-skeleton rounded-lg" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 eco-skeleton rounded-xl" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card hover={false}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-eco-green-dark flex items-center gap-2">
                    🏆 Ranking por Facultad
                </h3>
                <button
                    onClick={fetchRankings}
                    className="text-xs text-eco-gray hover:text-eco-green-dark transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
                >
                    🔄 Actualizar
                </button>
            </div>

            <div className="space-y-2">
                {rankings.map((faculty, index) => {
                    const isTop3 = index < 3;
                    const barWidth = rankings[0]?.total_points
                        ? Math.max(8, (faculty.total_points / rankings[0].total_points) * 100)
                        : 8;

                    return (
                        <div
                            key={faculty.id}
                            className={`relative rounded-xl p-3 sm:p-4 transition-all duration-300 hover:shadow-sm ${isTop3 ? 'bg-gradient-to-r from-eco-cream to-white border border-eco-green/10' : 'bg-gray-50/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Position */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isTop3 ? 'text-xl' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {isTop3 ? medals[index] : `${index + 1}`}
                                </div>

                                {/* Faculty Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{faculty.emoji}</span>
                                        <span className="font-semibold text-sm text-eco-green-dark truncate">
                                            {faculty.name}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono flex-shrink-0">
                                            {faculty.short_name}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${barWidth}%`,
                                                backgroundColor: faculty.color,
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-eco-gray">
                                            {faculty.member_count} miembros
                                        </span>
                                        <span className="text-[10px] text-eco-gray">
                                            {faculty.total_scans} escaneos
                                        </span>
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-eco-green-dark text-sm sm:text-base">
                                        {faculty.total_points.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-eco-gray">eco-puntos</p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {rankings.length === 0 && (
                    <div className="text-center py-6 text-eco-gray">
                        <p className="text-3xl mb-2">🏛️</p>
                        <p className="text-sm">No hay datos de facultades aún.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
