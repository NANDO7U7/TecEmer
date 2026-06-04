'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Badge {
    id: string;
    badge_type: string;
    title: string;
    description: string;
    threshold: number;
    earned_at: string;
    shared: boolean;
}

const BADGE_CATALOG = [
    {
        type: 'eco_novato',
        title: '🌱 Eco-Novato',
        description: 'Realizaste tu primer escaneo de reciclaje',
        threshold: 1,
        emoji: '🌱',
        color: 'from-green-400 to-green-500',
    },
    {
        type: 'reciclador_activo',
        title: '🌿 Reciclador Activo',
        description: 'Alcanzaste 500 eco-puntos reciclando',
        threshold: 500,
        emoji: '🌿',
        color: 'from-emerald-400 to-emerald-600',
    },
    {
        type: 'guardian_verde',
        title: '🌳 Guardián Verde',
        description: 'Acumulaste 2,000 eco-puntos por el planeta',
        threshold: 2000,
        emoji: '🌳',
        color: 'from-teal-500 to-green-600',
    },
    {
        type: 'lider_ambiental',
        title: '🏆 Líder Ambiental UGB',
        description: 'Alcanzaste 5,000 eco-puntos — Certificación digital de sostenibilidad',
        threshold: 5000,
        emoji: '🏆',
        color: 'from-amber-400 to-yellow-500',
    },
];

interface BadgeDisplayProps {
    userId?: string;
    ecoPuntos: number;
    totalScans: number;
}

export default function BadgeDisplay({ userId, ecoPuntos, totalScans }: BadgeDisplayProps) {
    const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
    const [showShareModal, setShowShareModal] = useState<string | null>(null);

    const fetchBadges = useCallback(async () => {
        if (!userId) return;
        const { data } = await supabase
            .from('eco_badges')
            .select('*')
            .eq('user_id', userId)
            .order('threshold', { ascending: true });

        if (data) setEarnedBadges(data);
    }, [userId]);

    const checkAndAwardBadges = useCallback(async () => {
        if (!userId) return;

        for (const badge of BADGE_CATALOG) {
            const qualifies =
                badge.type === 'eco_novato'
                    ? totalScans >= badge.threshold
                    : ecoPuntos >= badge.threshold;

            if (!qualifies) continue;

            // Check if already earned
            const { data: existing } = await supabase
                .from('eco_badges')
                .select('id')
                .eq('user_id', userId)
                .eq('badge_type', badge.type)
                .single();

            if (!existing) {
                await supabase.from('eco_badges').insert({
                    user_id: userId,
                    badge_type: badge.type,
                    title: badge.title,
                    description: badge.description,
                    threshold: badge.threshold,
                });
            }
        }

        fetchBadges();
    }, [userId, ecoPuntos, totalScans, fetchBadges]);

    useEffect(() => {
        if (userId) {
            fetchBadges();
            checkAndAwardBadges();
        }
    }, [userId, ecoPuntos, totalScans, fetchBadges, checkAndAwardBadges]);



    const shareBadge = async (badge: Badge) => {
        const text = `🎖️ ¡He obtenido la insignia "${badge.title}" en EcoScan AI de la UGB! 🌿♻️\n\n${badge.description}\n\n#EcoScanUGB #Sostenibilidad #UGB`;

        if (navigator.share) {
            try {
                await navigator.share({ title: badge.title, text });
            } catch {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(text);
            setShowShareModal(badge.id);
            setTimeout(() => setShowShareModal(null), 2000);
        }

        // Mark as shared
        await supabase
            .from('eco_badges')
            .update({ shared: true })
            .eq('id', badge.id);
    };

    const isEarned = (type: string) => earnedBadges.some((b) => b.badge_type === type);
    const getBadgeData = (type: string) => earnedBadges.find((b) => b.badge_type === type);

    return (
        <Card hover={false}>
            <h3 className="font-semibold text-eco-green-dark mb-4 flex items-center gap-2">
                🎖️ Insignias Digitales
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {BADGE_CATALOG.map((badge) => {
                    const earned = isEarned(badge.type);
                    const badgeRecord = getBadgeData(badge.type);
                    const progress = badge.type === 'eco_novato'
                        ? Math.min(100, (totalScans / badge.threshold) * 100)
                        : Math.min(100, (ecoPuntos / badge.threshold) * 100);

                    return (
                        <div
                            key={badge.type}
                            className={`relative rounded-xl p-3 sm:p-4 text-center transition-all duration-300 ${earned
                                    ? 'bg-gradient-to-br ' + badge.color + ' text-white shadow-lg hover:scale-[1.02]'
                                    : 'bg-gray-50 text-gray-400 border border-dashed border-gray-200'
                                }`}
                        >
                            {/* Badge Emoji */}
                            <div className={`text-3xl sm:text-4xl mb-2 ${earned ? '' : 'grayscale opacity-40'}`}>
                                {badge.emoji}
                            </div>

                            {/* Title */}
                            <p className={`text-xs sm:text-sm font-bold mb-1 ${earned ? 'text-white' : 'text-gray-500'
                                }`}>
                                {badge.title.replace(/^[^\s]+ /, '')}
                            </p>

                            {/* Progress or Date */}
                            {earned ? (
                                <p className="text-[10px] opacity-80">
                                    {new Date(badgeRecord!.earned_at).toLocaleDateString('es', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                            ) : (
                                <div className="mt-1">
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-eco-green rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {badge.type === 'eco_novato'
                                            ? `${totalScans}/${badge.threshold} escaneos`
                                            : `${ecoPuntos.toLocaleString()}/${badge.threshold.toLocaleString()} pts`}
                                    </p>
                                </div>
                            )}

                            {/* Share Button */}
                            {earned && badgeRecord && (
                                <button
                                    onClick={() => shareBadge(badgeRecord)}
                                    className="mt-2 px-3 py-1 rounded-full bg-white/20 text-[10px] font-medium hover:bg-white/30 transition-colors"
                                >
                                    {showShareModal === badgeRecord.id ? '✅ Copiado' : '📤 Compartir'}
                                </button>
                            )}

                            {/* Lock icon */}
                            {!earned && (
                                <div className="absolute top-2 right-2 text-xs opacity-40">🔒</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {earnedBadges.length === BADGE_CATALOG.length && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl text-center border border-amber-200">
                    <p className="text-sm font-bold text-amber-800">🎊 ¡Has desbloqueado todas las insignias!</p>
                    <p className="text-xs text-amber-600 mt-1">Eres un verdadero Líder Ambiental UGB.</p>
                </div>
            )}
        </Card>
    );
}
