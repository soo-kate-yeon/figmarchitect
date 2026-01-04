// ============================================
// TYPOGRAPHY SCALE GENERATION
// ============================================

import type { FormFactor, ScaleRatio, SemanticRole } from '../../types';

// ============================================
// MODULAR SCALE
// ============================================

export function generateTypeScale(
    baseFontSize: number,
    ratio: ScaleRatio
): Map<number, number> {
    const scale = new Map<number, number>();

    // Steps: -2 to 6 (9 steps total)
    for (let step = -2; step <= 6; step++) {
        const size = baseFontSize * Math.pow(ratio, step);
        // Round to 0.5px
        scale.set(step, Math.round(size * 2) / 2);
    }

    return scale;
}

// ============================================
// LINE HEIGHT CALCULATION
// ============================================

export function calculateLineHeight(fontSize: number): number {
    // Larger text = tighter line height
    // 12px → 1.7, 48px → 1.15
    const minSize = 12;
    const maxSize = 48;
    const maxLH = 1.7;
    const minLH = 1.15;

    const t = Math.min(1, Math.max(0, (fontSize - minSize) / (maxSize - minSize)));
    const lineHeight = maxLH - (maxLH - minLH) * t;

    return Math.round(lineHeight * 100) / 100;
}

// ============================================
// FONT WEIGHT CALCULATION
// ============================================

const WEIGHT_MAP: Record<SemanticRole, Record<string, number>> = {
    display: { default: 700, strong: 800, subtle: 600 },
    heading: { default: 600, strong: 700, subtle: 500 },
    title: { default: 600, strong: 700, subtle: 500 },
    body: { default: 400, strong: 600, subtle: 400 },
    label: { default: 500, strong: 600, subtle: 400 },
    caption: { default: 400, strong: 500, subtle: 400 },
};

export function calculateFontWeight(
    role: SemanticRole,
    emphasis: 'default' | 'strong' | 'subtle' = 'default'
): number {
    return WEIGHT_MAP[role][emphasis];
}

// ============================================
// LETTER SPACING CALCULATION
// ============================================

export function calculateLetterSpacing(fontSize: number): number {
    // Unit: em
    if (fontSize >= 40) return -0.02;
    if (fontSize >= 28) return -0.01;
    if (fontSize >= 20) return 0;
    if (fontSize >= 14) return 0.01;
    return 0.02;
}

// ============================================
// RESPONSIVE SCALING
// ============================================

const RESPONSIVE_MULTIPLIERS: Record<SemanticRole, Record<FormFactor, number>> = {
    display: { web: 1.0, tablet: 0.85, mobile: 0.70 },
    heading: { web: 1.0, tablet: 0.90, mobile: 0.80 },
    title: { web: 1.0, tablet: 0.95, mobile: 0.90 },
    body: { web: 1.0, tablet: 1.00, mobile: 1.00 },
    label: { web: 1.0, tablet: 1.00, mobile: 1.00 },
    caption: { web: 1.0, tablet: 1.00, mobile: 1.00 },
};

const MIN_SIZES: Record<SemanticRole, number> = {
    display: 32,
    heading: 20,
    title: 16,
    body: 14,
    label: 12,
    caption: 11,
};

export function calculateResponsiveFontSize(
    baseSize: number,
    role: SemanticRole,
    formFactor: FormFactor
): number {
    const multiplier = RESPONSIVE_MULTIPLIERS[role][formFactor];
    const adjusted = baseSize * multiplier;

    return Math.max(MIN_SIZES[role], Math.round(adjusted * 2) / 2);
}
