// ============================================
// FIGMA VARIABLES CONVERTER
// ============================================
// Converts generated design tokens to Figma Variables

import type { GeneratedPalettes, ColorScale } from '../types';

/**
 * Result of applying variables to Figma
 */
export interface ApplyVariablesResult {
    success: boolean;
    collectionsCreated: number;
    variablesCreated: number;
    errors: string[];
}

/**
 * Convert hex color to RGB object for Figma
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return { r: 0, g: 0, b: 0 };
    }
    return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
    };
}

/**
 * Create color variables from color palette
 */
function createColorVariablesFromScale(
    collection: VariableCollection,
    modeId: string,
    scaleName: string,
    scale: ColorScale
): Variable[] {
    const variables: Variable[] = [];

    for (const [step, color] of Object.entries(scale)) {
        const variableName = `${scaleName}/${step}`;
        const variable = figma.variables.createVariable(variableName, collection, 'COLOR');
        variable.setValueForMode(modeId, hexToRgb(color.hex));
        variables.push(variable);
    }

    return variables;
}

/**
 * Create all color variables from generated palettes
 */
export async function createColorVariables(
    tokens: { color?: { primitive?: Record<string, unknown> } },
    collectionName: string = 'Colors'
): Promise<ApplyVariablesResult> {
    const result: ApplyVariablesResult = {
        success: false,
        collectionsCreated: 0,
        variablesCreated: 0,
        errors: [],
    };

    try {
        // Check if color primitive exists
        if (!tokens.color?.primitive) {
            result.errors.push('No color primitives found in tokens');
            return result;
        }

        // Create collection
        const collection = figma.variables.createVariableCollection(collectionName);
        result.collectionsCreated = 1;

        // Get default mode
        const modeId = collection.modes[0].modeId;

        const primitives = tokens.color.primitive as Record<string, unknown>;

        // Create variables for each color scale
        for (const [scaleName, scale] of Object.entries(primitives)) {
            if (typeof scale === 'object' && scale !== null) {
                // Convert scale entries to ColorScale format
                const colorScale: ColorScale = {};
                for (const [step, value] of Object.entries(scale as Record<string, unknown>)) {
                    if (typeof value === 'object' && value !== null) {
                        const typedValue = value as { $value?: { hex?: string; components?: number[] } };
                        if (typedValue.$value?.hex) {
                            colorScale[parseInt(step)] = {
                                hex: typedValue.$value.hex,
                                oklch: { l: 0, c: 0, h: 0 },
                                srgb: typedValue.$value.components as [number, number, number] || [0, 0, 0],
                            };
                        }
                    }
                }

                const variables = createColorVariablesFromScale(
                    collection,
                    modeId,
                    scaleName,
                    colorScale
                );
                result.variablesCreated += variables.length;
            }
        }

        result.success = true;
    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
}

/**
 * Create spacing variables from spacing tokens
 */
export async function createSpacingVariables(
    tokens: { spacing?: Record<string, unknown> },
    collectionName: string = 'Spacing'
): Promise<ApplyVariablesResult> {
    const result: ApplyVariablesResult = {
        success: false,
        collectionsCreated: 0,
        variablesCreated: 0,
        errors: [],
    };

    try {
        if (!tokens.spacing) {
            result.errors.push('No spacing tokens found');
            return result;
        }

        // Create collection
        const collection = figma.variables.createVariableCollection(collectionName);
        result.collectionsCreated = 1;

        const modeId = collection.modes[0].modeId;

        // Create variables for each spacing value
        for (const [key, value] of Object.entries(tokens.spacing)) {
            if (key.startsWith('$')) continue; // Skip $type

            const typedValue = value as { $value?: { value?: number } | string };

            // Handle direct values
            if (typedValue.$value && typeof typedValue.$value === 'object' && 'value' in typedValue.$value) {
                const numValue = typedValue.$value.value;
                if (numValue !== undefined) {
                    const variableName = `spacing/${key}`;
                    const variable = figma.variables.createVariable(variableName, collection, 'FLOAT');
                    variable.setValueForMode(modeId, numValue);
                    result.variablesCreated++;
                }
            }
        }

        result.success = true;
    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
}

/**
 * Create radius variables from radius tokens
 */
export async function createRadiusVariables(
    tokens: { radius?: Record<string, unknown> },
    collectionName: string = 'Radius'
): Promise<ApplyVariablesResult> {
    const result: ApplyVariablesResult = {
        success: false,
        collectionsCreated: 0,
        variablesCreated: 0,
        errors: [],
    };

    try {
        if (!tokens.radius) {
            result.errors.push('No radius tokens found');
            return result;
        }

        // Create collection
        const collection = figma.variables.createVariableCollection(collectionName);
        result.collectionsCreated = 1;

        const modeId = collection.modes[0].modeId;

        // Create variables for each radius value
        for (const [key, value] of Object.entries(tokens.radius)) {
            if (key.startsWith('$')) continue; // Skip $type

            const typedValue = value as { $value?: { value?: number } };

            if (typedValue.$value && typeof typedValue.$value === 'object' && 'value' in typedValue.$value) {
                const numValue = typedValue.$value.value;
                if (numValue !== undefined) {
                    const variableName = `radius/${key}`;
                    const variable = figma.variables.createVariable(variableName, collection, 'FLOAT');
                    variable.setValueForMode(modeId, numValue);
                    result.variablesCreated++;
                }
            }
        }

        result.success = true;
    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
}

/**
 * Apply all tokens as Figma Variables
 */
export async function applyAllVariables(
    tokens: Record<string, unknown>,
    systemName: string = 'Design Tokens'
): Promise<ApplyVariablesResult> {
    const combinedResult: ApplyVariablesResult = {
        success: false,
        collectionsCreated: 0,
        variablesCreated: 0,
        errors: [],
    };

    // Create color variables
    const colorResult = await createColorVariables(
        tokens as { color?: { primitive?: Record<string, unknown> } },
        `${systemName}/Colors`
    );
    combinedResult.collectionsCreated += colorResult.collectionsCreated;
    combinedResult.variablesCreated += colorResult.variablesCreated;
    combinedResult.errors.push(...colorResult.errors);

    // Create spacing variables
    const spacingResult = await createSpacingVariables(
        tokens as { spacing?: Record<string, unknown> },
        `${systemName}/Spacing`
    );
    combinedResult.collectionsCreated += spacingResult.collectionsCreated;
    combinedResult.variablesCreated += spacingResult.variablesCreated;
    combinedResult.errors.push(...spacingResult.errors);

    // Create radius variables
    const radiusResult = await createRadiusVariables(
        tokens as { radius?: Record<string, unknown> },
        `${systemName}/Radius`
    );
    combinedResult.collectionsCreated += radiusResult.collectionsCreated;
    combinedResult.variablesCreated += radiusResult.variablesCreated;
    combinedResult.errors.push(...radiusResult.errors);

    combinedResult.success = combinedResult.errors.length === 0 ||
        combinedResult.variablesCreated > 0;

    return combinedResult;
}
