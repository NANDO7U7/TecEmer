'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import { calculateCarbonOffset, getImpactMessage, CO2_PER_TREE_YEAR } from '@/lib/carbonOffset';

interface ImpactStatsProps {
    userId?: string;
}

export default function ImpactStats({ userId }: ImpactStatsProps) {
    const [plasticCount, setPlasticCount] = useState(0);
    const [canCount, setCanCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('recycling_logs')
            .select('material')
            .eq('user_id', userId!);

        if (data) {
            setPlasticCount(data.filter((r) => r.material === 'plastico').length);
            setCanCount(data.filter((r) => r.material === 'lata').length);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (userId) fetchCounts();
    }, [userId, fetchCounts]);

    const stats = calculateCarbonOffset(plasticCount, canCount);
    const impact = getImpactMessage(stats.totalCO2Kg);

    // Tree fill percentage (capped at 100% at 22kg = 1 full tree)
    const treeFillPercent = Math.min(100, (stats.totalCO2Kg / CO2_PER_TREE_YEAR) * 100);

    if (loading) {
        return (
            <Card>
                <div className="space-y-3">
                    <div className="h-6 w-40 eco-skeleton rounded-lg" />
                    <div className="h-32 eco-skeleton rounded-xl" />
                </div>
            </Card>
        );
    }

    return (
        <Card hover={false} glass>
            <h3 className="font-semibold text-eco-green-dark mb-4 flex items-center gap-2">
                🌍 Impacto Ambiental
            </h3>

            {/* Tree visualization */}
            <div className="flex items-center gap-4 sm:gap-6 mb-4">
                {/* Animated tree */}
                <div className="relative w-20 h-24 sm:w-24 sm:h-28 flex-shrink-0">
                    {/* Tree trunk */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-8 bg-amber-700 rounded-t-sm" />
                    {/* Tree crown (fills up) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                        <div
                            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out rounded-b-full"
                            style={{
                                height: `${treeFillPercent}%`,
                                background: `linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)`,
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">
                            {impact.emoji}
                        </div>
                    </div>
                    {/* Percentage label */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-eco-green-dark bg-eco-cream px-1.5 rounded-full">
                        {treeFillPercent.toFixed(0)}%
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 min-w-0">
                    <p className="text-2xl sm:text-3xl font-bold text-eco-green-dark animate-count-up">
                        {stats.totalCO2Kg.toFixed(2)} <span className="text-base sm:text-lg font-medium">kg CO₂</span>
                    </p>
                    <p className="text-xs sm:text-sm text-eco-gray mt-1">
                        {impact.message}
                    </p>
                </div>
            </div>

            {/* Equivalence cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-eco-cream/70 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl mb-0.5">🌳</p>
                    <p className="text-sm sm:text-base font-bold text-eco-green-dark">{stats.treesEquivalent}</p>
                    <p className="text-[9px] sm:text-[10px] text-eco-gray leading-tight">árboles/año equivalente</p>
                </div>
                <div className="bg-eco-cream/70 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl mb-0.5">🚗</p>
                    <p className="text-sm sm:text-base font-bold text-eco-green-dark">{stats.drivingKmSaved}</p>
                    <p className="text-[9px] sm:text-[10px] text-eco-gray leading-tight">km de auto ahorrados</p>
                </div>
                <div className="bg-eco-cream/70 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl mb-0.5">📱</p>
                    <p className="text-sm sm:text-base font-bold text-eco-green-dark">{stats.phoneChargesSaved}</p>
                    <p className="text-[9px] sm:text-[10px] text-eco-gray leading-tight">cargas de celular</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-eco-gray">
                <span>🟢 {plasticCount} plásticos × 0.05 kg = {(plasticCount * 0.05).toFixed(2)} kg</span>
                <span>🟡 {canCount} latas × 0.15 kg = {(canCount * 0.15).toFixed(2)} kg</span>
            </div>
        </Card>
    );
}
