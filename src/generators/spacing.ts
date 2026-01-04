// ============================================
// SPACING SCALE GENERATION
// ============================================

import type { GridUnit, DTCGDimensionValue } from '../types';

interface SpacingToken {
    $value: DTCGDimensionValue;
    $description?: string;
}

export function generateSpacingScale(gridUnit: GridUnit): Record<string, SpacingToken> {
    const multipliers = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];

    const scale: Record<string, SpacingToken> = {};

    for (const mult of multipliers) {
        const value = gridUnit * mult;
        const key = mult === 0 ? '0'
            : mult % 1 === 0 ? String(mult)
                : String(mult).replace('.', '-');

        scale[key] = {
            $value: { value, unit: 'px' },
        };
    }

    // Add semantic aliases
    const semanticSpacing: Record<string, string> = {
        'none': '0',
        'xs': '1',
        'sm': '2',
        'md': '4',
        'lg': '6',
        'xl': '8',
        '2xl': '12',
        '3xl': '16',
        '4xl': '24',
    };

    for (const [semantic, scaleKey] of Object.entries(semanticSpacing)) {
        if (scale[scaleKey]) {
            scale[`semantic.${semantic}`] = {
                $value: `{spacing.${scaleKey}}` as unknown as DTCGDimensionValue,
            };
        }
    }

    return scale;
}
