// ============================================
// MAIN GENERATOR ORCHESTRATOR
// ============================================

import { oklch } from 'culori';
import { generatePrimaryPalette, generateNeutralPalette, generateStatusPalettes } from './color/palette';
import { generateSemanticColors } from './color/semantic';
import { generateTypographySystem } from './typography/semantic';
import { generateSpacingScale } from './spacing';
import { generateRadiusScale } from './radius';
import { generateElevationScale } from './elevation';
import { assembleDTCGFile, exportToJSON } from '../formatters/dtcg';
import type { DesignSystemInput, DTCGTokenFile } from '../types';

export function generateDesignTokens(input: DesignSystemInput): DTCGTokenFile {
    // Get background lightness for mode detection
    const backgroundOklch = oklch(input.colors.background.default);
    const backgroundL = backgroundOklch?.l ?? 0.98;
    const isLightMode = backgroundL > 0.5;

    // 1. Generate primitive color palettes
    const primitives = {
        primary: generatePrimaryPalette(input.colors.primary),
        neutral: generateNeutralPalette({
            backgroundHex: input.colors.background.default,
            primaryHex: input.colors.primary,
            mode: input.colors.background.mode,
        }),
        secondary: input.colors.secondary
            ? generatePrimaryPalette(input.colors.secondary)
            : undefined,
        accent: input.colors.accent
            ? generatePrimaryPalette(input.colors.accent)
            : undefined,
        status: generateStatusPalettes(),
    };

    // 2. Generate semantic colors
    const semanticColors = generateSemanticColors({ backgroundL });

    // 3. Generate typography
    const typography = generateTypographySystem({
        fontFamily: input.typography.fontFamily,
        baseFontSize: input.typography.baseFontSize,
        scaleRatio: input.typography.scaleRatio,
        formFactors: input.formFactors,
    });

    // 4. Generate spacing
    const spacing = generateSpacingScale(input.spacing.gridUnit);

    // 5. Generate radius
    const radius = generateRadiusScale(input.radius.style);

    // 6. Generate elevation
    const elevation = generateElevationScale({ isLightMode });

    // 7. Assemble DTCG file
    return assembleDTCGFile({
        primitives,
        semanticColors,
        typography,
        spacing,
        radius,
        elevation,
    });
}

export function generateAndExport(input: DesignSystemInput): string {
    const tokenFile = generateDesignTokens(input);
    return exportToJSON(tokenFile);
}
