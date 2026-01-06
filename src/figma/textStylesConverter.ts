// ============================================
// FIGMA TEXT STYLES CONVERTER
// ============================================
// Converts typography tokens to Figma Text Styles

/**
 * Result of creating text styles
 */
export interface CreateTextStylesResult {
    success: boolean;
    stylesCreated: number;
    errors: string[];
    fontsLoaded: string[];
}

/**
 * Typography token value structure
 */
interface TypographyValue {
    fontFamily: string[];
    fontSize: { value: number; unit: string };
    fontWeight: number;
    lineHeight: number;
    letterSpacing: { value: number; unit: string };
}

/**
 * Map numeric font weight to Figma font style name
 */
function weightToStyle(weight: number): string {
    const weightMap: Record<number, string> = {
        100: 'Thin',
        200: 'ExtraLight',
        300: 'Light',
        400: 'Regular',
        500: 'Medium',
        600: 'SemiBold',
        700: 'Bold',
        800: 'ExtraBold',
        900: 'Black',
    };
    return weightMap[weight] || 'Regular';
}

/**
 * Try to load a font with fallbacks
 */
async function loadFontWithFallback(
    fontFamily: string[],
    weight: number
): Promise<FontName | null> {
    const style = weightToStyle(weight);

    // Try each font family in order
    for (const family of fontFamily) {
        try {
            const fontName: FontName = { family, style };
            await figma.loadFontAsync(fontName);
            return fontName;
        } catch {
            // Try Regular style as fallback
            try {
                const regularFont: FontName = { family, style: 'Regular' };
                await figma.loadFontAsync(regularFont);
                return regularFont;
            } catch {
                // Continue to next font
            }
        }
    }

    // Ultimate fallback: Inter
    try {
        const fallback: FontName = { family: 'Inter', style: 'Regular' };
        await figma.loadFontAsync(fallback);
        return fallback;
    } catch {
        return null;
    }
}

/**
 * Convert line height ratio to Figma LineHeight
 */
function convertLineHeight(ratio: number): LineHeight {
    // Convert decimal ratio (e.g., 1.5) to percentage (e.g., 150%)
    return {
        value: ratio * 100,
        unit: 'PERCENT',
    };
}

/**
 * Convert letter spacing to Figma LetterSpacing
 */
function convertLetterSpacing(spacing: { value: number; unit: string }): LetterSpacing {
    if (spacing.unit === 'em') {
        // Convert em to percent (1em = 100%)
        return {
            value: spacing.value * 100,
            unit: 'PERCENT',
        };
    }
    return {
        value: spacing.value,
        unit: 'PIXELS',
    };
}

/**
 * Create text styles from typography tokens
 */
export async function createTextStyles(
    tokens: { typography?: Record<string, unknown> },
    formFactor: string = 'web'
): Promise<CreateTextStylesResult> {
    const result: CreateTextStylesResult = {
        success: false,
        stylesCreated: 0,
        errors: [],
        fontsLoaded: [],
    };

    try {
        if (!tokens.typography) {
            result.errors.push('No typography tokens found');
            return result;
        }

        const typography = tokens.typography as Record<string, unknown>;

        // Iterate through typography categories (heading, body, etc.)
        for (const [category, sizes] of Object.entries(typography)) {
            if (category.startsWith('$')) continue; // Skip $type

            if (typeof sizes !== 'object' || sizes === null) continue;

            // Iterate through sizes (h1, h2, md, lg, etc.)
            for (const [size, formFactors] of Object.entries(sizes as Record<string, unknown>)) {
                if (typeof formFactors !== 'object' || formFactors === null) continue;

                // Get the specified form factor or default to first available
                const formFactorData = (formFactors as Record<string, unknown>)[formFactor];
                if (!formFactorData) continue;

                const typedData = formFactorData as { $value?: TypographyValue };
                if (!typedData.$value) continue;

                const value = typedData.$value;

                try {
                    // Load font
                    const fontName = await loadFontWithFallback(value.fontFamily, value.fontWeight);
                    if (!fontName) {
                        result.errors.push(`Could not load font for ${category}/${size}`);
                        continue;
                    }

                    // Track loaded fonts
                    const fontKey = `${fontName.family} ${fontName.style}`;
                    if (!result.fontsLoaded.includes(fontKey)) {
                        result.fontsLoaded.push(fontKey);
                    }

                    // Create text style
                    const style = figma.createTextStyle();
                    style.name = `${category}/${size}`;
                    style.fontSize = value.fontSize.value;
                    style.fontName = fontName;
                    style.lineHeight = convertLineHeight(value.lineHeight);
                    style.letterSpacing = convertLetterSpacing(value.letterSpacing);

                    result.stylesCreated++;
                } catch (error) {
                    result.errors.push(
                        `Failed to create style ${category}/${size}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }
        }

        result.success = result.stylesCreated > 0;
    } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
}

/**
 * Get available fonts in Figma for validation
 */
export async function getAvailableFonts(): Promise<Font[]> {
    return await figma.listAvailableFontsAsync();
}

/**
 * Check if a specific font family is available
 */
export async function isFontAvailable(family: string): Promise<boolean> {
    const fonts = await getAvailableFonts();
    return fonts.some(font => font.fontName.family === family);
}
