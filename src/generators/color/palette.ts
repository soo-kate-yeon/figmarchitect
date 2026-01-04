// ============================================
// COLOR PALETTE GENERATION
// ============================================

import { oklch, formatHex, clampChroma, type Oklch } from 'culori';
import type { ColorScale } from '../../types';

// ============================================
// CONSTANTS
// ============================================

const PALETTE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const LIGHTNESS_SCALE: Record<number, { l: number; chromaScale: number }> = {
    50: { l: 0.97, chromaScale: 0.25 },
    100: { l: 0.93, chromaScale: 0.40 },
    200: { l: 0.87, chromaScale: 0.60 },
    300: { l: 0.78, chromaScale: 0.80 },
    400: { l: 0.68, chromaScale: 0.95 },
    500: { l: 0.55, chromaScale: 1.00 },
    600: { l: 0.48, chromaScale: 0.95 },
    700: { l: 0.40, chromaScale: 0.85 },
    800: { l: 0.32, chromaScale: 0.75 },
    900: { l: 0.24, chromaScale: 0.65 },
};

// ============================================
// PRIMARY PALETTE GENERATION
// ============================================

export function generatePrimaryPalette(primaryHex: string): ColorScale {
    const base = oklch(primaryHex);
    if (!base) throw new Error(`Invalid color: ${primaryHex}`);

    const palette: ColorScale = {};

    for (const step of PALETTE_STEPS) {
        const params = LIGHTNESS_SCALE[step];

        const rawColor: Oklch = {
            mode: 'oklch',
            l: params.l,
            c: (base.c ?? 0.15) * params.chromaScale,
            h: base.h ?? 0,
        };

        const clamped = clampChroma(rawColor, 'oklch');
        const hex = formatHex(clamped);

        palette[step] = {
            hex,
            oklch: { l: clamped.l, c: clamped.c ?? 0, h: clamped.h ?? 0 },
            srgb: hexToSRGB(hex),
        };
    }

    return palette;
}

// ============================================
// NEUTRAL PALETTE GENERATION (BACKGROUND-BASED)
// ============================================

interface NeutralConfig {
    backgroundHex: string;
    primaryHex: string;
    mode: 'pure' | 'tinted' | 'custom';
}

export function generateNeutralPalette(config: NeutralConfig): ColorScale {
    const background = oklch(config.backgroundHex);
    const primary = oklch(config.primaryHex);

    if (!background || !primary) {
        throw new Error('Invalid color input');
    }

    const isLightMode = background.l > 0.5;

    // Neutral hue: tinted면 primary hue 사용, 아니면 background hue
    const neutralHue = config.mode === 'tinted'
        ? primary.h ?? 0
        : background.h ?? 0;

    // Neutral chroma: tinted면 약간의 채도, 아니면 거의 무채색
    const neutralChroma = config.mode === 'tinted' ? 0.012 : 0.005;

    const lightnessScale = isLightMode
        ? generateLightModeScale(background.l)
        : generateDarkModeScale(background.l);

    const palette: ColorScale = {};

    for (const step of PALETTE_STEPS) {
        const targetL = lightnessScale[step];

        const rawColor: Oklch = {
            mode: 'oklch',
            l: targetL,
            c: neutralChroma,
            h: neutralHue,
        };

        const clamped = clampChroma(rawColor, 'oklch');
        const hex = formatHex(clamped);

        palette[step] = {
            hex,
            oklch: { l: clamped.l, c: clamped.c ?? 0, h: clamped.h ?? 0 },
            srgb: hexToSRGB(hex),
        };
    }

    return palette;
}

function generateLightModeScale(backgroundL: number): Record<number, number> {
    return {
        50: backgroundL,
        100: Math.max(0.90, backgroundL - 0.03),
        200: Math.max(0.85, backgroundL - 0.08),
        300: 0.78,
        400: 0.65,
        500: 0.55,
        600: 0.45,
        700: 0.35,
        800: 0.25,
        900: 0.15,
    };
}

function generateDarkModeScale(backgroundL: number): Record<number, number> {
    return {
        50: 0.97,
        100: 0.93,
        200: 0.85,
        300: 0.75,
        400: 0.60,
        500: 0.50,
        600: 0.40,
        700: 0.30,
        800: Math.min(0.25, backgroundL + 0.05),
        900: backgroundL,
    };
}

// ============================================
// STATUS COLOR PALETTES
// ============================================

const STATUS_COLORS = {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
} as const;

export function generateStatusPalettes(): {
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
} {
    return {
        success: generatePrimaryPalette(STATUS_COLORS.success),
        warning: generatePrimaryPalette(STATUS_COLORS.warning),
        error: generatePrimaryPalette(STATUS_COLORS.error),
        info: generatePrimaryPalette(STATUS_COLORS.info),
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function hexToSRGB(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];

    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
    ];
}
