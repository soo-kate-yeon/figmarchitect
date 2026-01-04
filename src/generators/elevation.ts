// ============================================
// ELEVATION (SHADOW) GENERATION
// ============================================

import type { DTCGShadowValue } from '../types';

interface ElevationConfig {
    isLightMode: boolean;
}

interface ElevationToken {
    $value: DTCGShadowValue | DTCGShadowValue[];
    $description?: string;
}

export function generateElevationScale(config: ElevationConfig): Record<string, ElevationToken> {
    const shadowColor = config.isLightMode
        ? { colorSpace: 'srgb' as const, components: [0, 0, 0] as [number, number, number], alpha: 0.1 }
        : { colorSpace: 'srgb' as const, components: [0, 0, 0] as [number, number, number], alpha: 0.3 };

    return {
        none: {
            $value: {
                color: { ...shadowColor, alpha: 0 },
                offsetX: { value: 0, unit: 'px' },
                offsetY: { value: 0, unit: 'px' },
                blur: { value: 0, unit: 'px' },
                spread: { value: 0, unit: 'px' },
            },
            $description: 'No elevation',
        },

        sm: {
            $value: {
                color: shadowColor,
                offsetX: { value: 0, unit: 'px' },
                offsetY: { value: 1, unit: 'px' },
                blur: { value: 2, unit: 'px' },
                spread: { value: 0, unit: 'px' },
            },
            $description: 'Small elevation for subtle depth',
        },

        md: {
            $value: [
                {
                    color: shadowColor,
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 2, unit: 'px' },
                    blur: { value: 4, unit: 'px' },
                    spread: { value: -1, unit: 'px' },
                },
                {
                    color: { ...shadowColor, alpha: shadowColor.alpha! * 0.6 },
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 4, unit: 'px' },
                    blur: { value: 6, unit: 'px' },
                    spread: { value: -1, unit: 'px' },
                },
            ],
            $description: 'Medium elevation for cards',
        },

        lg: {
            $value: [
                {
                    color: shadowColor,
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 4, unit: 'px' },
                    blur: { value: 6, unit: 'px' },
                    spread: { value: -2, unit: 'px' },
                },
                {
                    color: { ...shadowColor, alpha: shadowColor.alpha! * 0.5 },
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 10, unit: 'px' },
                    blur: { value: 15, unit: 'px' },
                    spread: { value: -3, unit: 'px' },
                },
            ],
            $description: 'Large elevation for modals',
        },

        xl: {
            $value: [
                {
                    color: shadowColor,
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 8, unit: 'px' },
                    blur: { value: 10, unit: 'px' },
                    spread: { value: -4, unit: 'px' },
                },
                {
                    color: { ...shadowColor, alpha: shadowColor.alpha! * 0.4 },
                    offsetX: { value: 0, unit: 'px' },
                    offsetY: { value: 20, unit: 'px' },
                    blur: { value: 25, unit: 'px' },
                    spread: { value: -5, unit: 'px' },
                },
            ],
            $description: 'Extra large elevation for popovers',
        },
    };
}
