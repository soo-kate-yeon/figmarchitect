// ============================================
// SEMANTIC TYPOGRAPHY GENERATION
// ============================================

import {
    generateTypeScale,
    calculateLineHeight,
    calculateFontWeight,
    calculateLetterSpacing,
    calculateResponsiveFontSize,
} from './scale';
import type { FormFactor, ScaleRatio, SemanticRole, DTCGTypographyValue } from '../../types';

interface TypographyInput {
    fontFamily: {
        primary: string;
        secondary?: string;
        mono?: string;
    };
    baseFontSize: number;
    scaleRatio: ScaleRatio;
    formFactors: FormFactor[];
}

interface TokenDefinition {
    scaleStep: number;
    role: SemanticRole;
    family: 'primary' | 'heading' | 'mono';
    emphasis: 'default' | 'strong' | 'subtle';
}

const TOKEN_DEFINITIONS: Record<string, TokenDefinition> = {
    // Display - Marketing, hero sections
    'display.2xl': { scaleStep: 6, role: 'display', family: 'heading', emphasis: 'default' },
    'display.xl': { scaleStep: 5, role: 'display', family: 'heading', emphasis: 'default' },
    'display.lg': { scaleStep: 4, role: 'display', family: 'heading', emphasis: 'default' },
    'display.md': { scaleStep: 3, role: 'display', family: 'heading', emphasis: 'default' },
    'display.sm': { scaleStep: 2, role: 'display', family: 'heading', emphasis: 'default' },

    // Heading - Page/section headings
    'heading.h1': { scaleStep: 5, role: 'heading', family: 'heading', emphasis: 'default' },
    'heading.h2': { scaleStep: 4, role: 'heading', family: 'heading', emphasis: 'default' },
    'heading.h3': { scaleStep: 3, role: 'heading', family: 'heading', emphasis: 'default' },
    'heading.h4': { scaleStep: 2, role: 'heading', family: 'heading', emphasis: 'default' },
    'heading.h5': { scaleStep: 1, role: 'heading', family: 'heading', emphasis: 'default' },
    'heading.h6': { scaleStep: 0, role: 'heading', family: 'heading', emphasis: 'default' },

    // Title - Cards, modals
    'title.lg': { scaleStep: 2, role: 'title', family: 'primary', emphasis: 'default' },
    'title.md': { scaleStep: 1, role: 'title', family: 'primary', emphasis: 'default' },
    'title.sm': { scaleStep: 0, role: 'title', family: 'primary', emphasis: 'default' },

    // Body - Body text
    'body.lg': { scaleStep: 1, role: 'body', family: 'primary', emphasis: 'default' },
    'body.md': { scaleStep: 0, role: 'body', family: 'primary', emphasis: 'default' },
    'body.sm': { scaleStep: -1, role: 'body', family: 'primary', emphasis: 'default' },

    // Label - Buttons, form labels
    'label.lg': { scaleStep: 0, role: 'label', family: 'primary', emphasis: 'default' },
    'label.md': { scaleStep: -1, role: 'label', family: 'primary', emphasis: 'default' },
    'label.sm': { scaleStep: -2, role: 'label', family: 'primary', emphasis: 'default' },

    // Caption - Helper text
    'caption.md': { scaleStep: -1, role: 'caption', family: 'primary', emphasis: 'subtle' },
    'caption.sm': { scaleStep: -2, role: 'caption', family: 'primary', emphasis: 'subtle' },

    // Code - Code blocks
    'code.block': { scaleStep: -1, role: 'body', family: 'mono', emphasis: 'default' },
    'code.inline': { scaleStep: 0, role: 'body', family: 'mono', emphasis: 'default' },
};

export function generateTypographySystem(input: TypographyInput) {
    const { fontFamily, baseFontSize, scaleRatio, formFactors } = input;

    // Font stacks
    const primaryStack = [fontFamily.primary, 'system-ui', 'sans-serif'];
    const headingStack = fontFamily.secondary
        ? [fontFamily.secondary, 'system-ui', 'sans-serif']
        : primaryStack;
    const monoStack = fontFamily.mono
        ? [fontFamily.mono, 'monospace']
        : ['ui-monospace', 'SFMono-Regular', 'monospace'];

    // Generate modular scale
    const scale = generateTypeScale(baseFontSize, scaleRatio);

    // Build result
    const result: Record<string, Record<FormFactor, { $value: DTCGTypographyValue }>> = {};

    for (const [tokenPath, def] of Object.entries(TOKEN_DEFINITIONS)) {
        const baseSize = scale.get(def.scaleStep)!;

        const familyStack = def.family === 'heading' ? headingStack
            : def.family === 'mono' ? monoStack
                : primaryStack;

        result[tokenPath] = {} as Record<FormFactor, { $value: DTCGTypographyValue }>;

        for (const formFactor of formFactors) {
            const responsiveSize = calculateResponsiveFontSize(baseSize, def.role, formFactor);

            result[tokenPath][formFactor] = {
                $value: {
                    fontFamily: familyStack,
                    fontSize: { value: responsiveSize, unit: 'px' },
                    fontWeight: calculateFontWeight(def.role, def.emphasis),
                    lineHeight: calculateLineHeight(responsiveSize),
                    letterSpacing: {
                        value: calculateLetterSpacing(responsiveSize),
                        unit: 'em',
                    },
                },
            };
        }
    }

    return result;
}
