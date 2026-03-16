/**
 * EcoScan AI — Carbon Offset Calculator
 *
 * Conversion constants based on EPA & recycling industry standards:
 * - 1 PET plastic bottle ≈ 0.05 kg CO₂ avoided
 * - 1 aluminum can       ≈ 0.15 kg CO₂ avoided
 * - 1 mature tree absorbs ≈ 22 kg CO₂ per year
 */

export const CO2_PER_PLASTIC = 0.05; // kg CO₂ per bottle
export const CO2_PER_CAN = 0.15;     // kg CO₂ per can
export const CO2_PER_TREE_YEAR = 22;  // kg CO₂ absorbed by 1 tree/year

export interface CarbonStats {
    totalCO2Kg: number;
    treesEquivalent: number;
    drivingKmSaved: number;       // ~0.21 kg CO₂ per km driven
    phoneChargesSaved: number;    // ~0.005 kg CO₂ per charge
}

/**
 * Calculate carbon offset from recycling counts
 */
export function calculateCarbonOffset(
    plasticCount: number,
    canCount: number
): CarbonStats {
    const totalCO2Kg =
        plasticCount * CO2_PER_PLASTIC +
        canCount * CO2_PER_CAN;

    return {
        totalCO2Kg: Math.round(totalCO2Kg * 100) / 100,
        treesEquivalent: Math.round((totalCO2Kg / CO2_PER_TREE_YEAR) * 100) / 100,
        drivingKmSaved: Math.round(totalCO2Kg / 0.21),
        phoneChargesSaved: Math.round(totalCO2Kg / 0.005),
    };
}

/**
 * Get a motivational message based on CO₂ saved
 */
export function getImpactMessage(co2Kg: number): { emoji: string; message: string } {
    if (co2Kg >= 10) return { emoji: '🌳', message: `¡Increíble! Has salvado el equivalente a ${(co2Kg / CO2_PER_TREE_YEAR).toFixed(1)} árboles por año` };
    if (co2Kg >= 5) return { emoji: '🌿', message: '¡Gran impacto! Sigues reduciendo tu huella de carbono' };
    if (co2Kg >= 1) return { emoji: '🌱', message: '¡Buen comienzo! Cada reciclaje cuenta' };
    if (co2Kg > 0) return { emoji: '🍃', message: 'Ya estás haciendo la diferencia' };
    return { emoji: '🌍', message: 'Escanea tu primer residuo para empezar' };
}
