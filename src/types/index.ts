// ============================================
// INTERNAL TYPES
// ============================================

export interface OKLCHColor {
    l: number;  // 0-1
    c: number;  // 0-0.4
    h: number;  // 0-360
}

export interface ColorScale {
    [step: number]: {
        hex: string;
        oklch: OKLCHColor;
        srgb: [number, number, number];
    };
}

export interface GeneratedPalettes {
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
}

export type SemanticRole = 'display' | 'heading' | 'title' | 'body' | 'label' | 'caption';
export type Emphasis = 'default' | 'strong' | 'subtle';

// Re-export all types
export * from './input';
export * from './dtcg';
