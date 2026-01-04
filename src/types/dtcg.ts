// ============================================
// DTCG 2025.10 FORMAT TYPES
// ============================================

export interface DTCGColorValue {
    colorSpace: 'srgb' | 'oklch';
    components: [number, number, number];
    alpha?: number;
    hex?: string;
}

export interface DTCGDimensionValue {
    value: number;
    unit: 'px' | 'rem' | 'em';
}

export interface DTCGTypographyValue {
    fontFamily: string[];
    fontSize: DTCGDimensionValue;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: DTCGDimensionValue;
}

export interface DTCGShadowValue {
    color: DTCGColorValue;
    offsetX: DTCGDimensionValue;
    offsetY: DTCGDimensionValue;
    blur: DTCGDimensionValue;
    spread: DTCGDimensionValue;
    inset?: boolean;
}

// Token with value
export interface DTCGToken<T> {
    $value: T | string;  // string for alias references like "{color.primary.500}"
    $type?: string;
    $description?: string;
    $deprecated?: boolean | string;
    $extensions?: Record<string, unknown>;
}

// Group container
export interface DTCGGroup {
    $type?: string;
    $description?: string;
    [key: string]: DTCGToken<unknown> | DTCGGroup | string | undefined;
}

// Root token file
export interface DTCGTokenFile {
    color: DTCGGroup;
    typography: DTCGGroup;
    spacing: DTCGGroup;
    radius: DTCGGroup;
    elevation: DTCGGroup;
}
