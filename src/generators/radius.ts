// ============================================
// BORDER RADIUS GENERATION
// ============================================

import type { RadiusStyle, DTCGDimensionValue } from '../types';

interface RadiusToken {
    $value: DTCGDimensionValue;
    $description?: string;
}

const RADIUS_SCALES: Record<RadiusStyle, Record<string, number>> = {
    sharp: {
        none: 0,
        sm: 2,
        md: 4,
        lg: 6,
        xl: 8,
        '2xl': 12,
        full: 9999,
    },
    rounded: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 24,
        full: 9999,
    },
    pill: {
        none: 0,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
        full: 9999,
    },
};

export function generateRadiusScale(style: RadiusStyle): Record<string, RadiusToken> {
    const values = RADIUS_SCALES[style];
    const scale: Record<string, RadiusToken> = {};

    for (const [key, value] of Object.entries(values)) {
        scale[key] = {
            $value: { value, unit: 'px' },
        };
    }

    return scale;
}
