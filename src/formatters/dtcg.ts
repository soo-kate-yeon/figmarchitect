// ============================================
// DTCG JSON ASSEMBLY
// ============================================

import type {
    DTCGTokenFile,
    DTCGColorValue,
    ColorScale,
} from '../types';

interface AssemblyInput {
    primitives: {
        primary: ColorScale;
        neutral: ColorScale;
        secondary?: ColorScale;
        accent?: ColorScale;
        status: {
            success: ColorScale;
            warning: ColorScale;
            error: ColorScale;
            info: ColorScale;
        };
    };
    semanticColors: ReturnType<typeof import('../generators/color/semantic').generateSemanticColors>;
    typography: ReturnType<typeof import('../generators/typography/semantic').generateTypographySystem>;
    spacing: ReturnType<typeof import('../generators/spacing').generateSpacingScale>;
    radius: ReturnType<typeof import('../generators/radius').generateRadiusScale>;
    elevation: ReturnType<typeof import('../generators/elevation').generateElevationScale>;
}

export function assembleDTCGFile(input: AssemblyInput): DTCGTokenFile {
    return {
        color: {
            $type: 'color',

            primitive: {
                primary: formatColorScale(input.primitives.primary),
                neutral: formatColorScale(input.primitives.neutral),
                ...(input.primitives.secondary && {
                    secondary: formatColorScale(input.primitives.secondary)
                }),
                ...(input.primitives.accent && {
                    accent: formatColorScale(input.primitives.accent)
                }),
                green: formatColorScale(input.primitives.status.success),
                amber: formatColorScale(input.primitives.status.warning),
                red: formatColorScale(input.primitives.status.error),
                blue: formatColorScale(input.primitives.status.info),
            },

            semantic: input.semanticColors,
        },

        typography: {
            $type: 'typography',
            ...formatTypography(input.typography),
        },

        spacing: {
            $type: 'dimension',
            ...input.spacing,
        },

        radius: {
            $type: 'dimension',
            ...input.radius,
        },

        elevation: {
            $type: 'shadow',
            ...input.elevation,
        },
    };
}

function formatColorScale(scale: ColorScale) {
    const result: Record<string, { $value: DTCGColorValue }> = {};

    for (const [step, color] of Object.entries(scale)) {
        result[step] = {
            $value: {
                colorSpace: 'srgb',
                components: color.srgb,
                hex: color.hex,
            },
        };
    }

    return result;
}

function formatTypography(
    typography: Record<string, Record<string, { $value: unknown }>>
) {
    const result: Record<string, Record<string, unknown>> = {};

    for (const [path, formFactors] of Object.entries(typography)) {
        const [category, size] = path.split('.');

        if (!result[category]) {
            result[category] = {};
        }

        result[category][size] = formFactors;
    }

    return result;
}

// ============================================
// JSON EXPORT
// ============================================

export function exportToJSON(tokenFile: DTCGTokenFile): string {
    return JSON.stringify(tokenFile, null, 2);
}

export function downloadJSON(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.tokens.json') ? filename : `${filename}.tokens.json`;
    a.click();

    URL.revokeObjectURL(url);
}
