// ============================================
// USER INPUT TYPES
// ============================================

export type FormFactor = 'web' | 'tablet' | 'mobile';
export type BackgroundMode = 'pure' | 'tinted' | 'custom';
export type ScaleRatio = 1.067 | 1.125 | 1.200 | 1.250 | 1.333 | 1.414 | 1.500 | 1.618;
export type RadiusStyle = 'sharp' | 'rounded' | 'pill';
export type GridUnit = 4 | 8;

export interface DesignSystemInput {
    systemName: string;
    formFactors: FormFactor[];

    colors: {
        primary: string;  // HEX
        background: {
            default: string;  // HEX
            mode: BackgroundMode;
        };
        secondary?: string;  // HEX
        accent?: string;  // HEX
    };

    typography: {
        fontFamily: {
            primary: string;
            secondary?: string;
            mono?: string;
        };
        baseFontSize: number;  // px
        scaleRatio: ScaleRatio;
    };

    spacing: {
        gridUnit: GridUnit;
    };

    radius: {
        style: RadiusStyle;
    };
}
