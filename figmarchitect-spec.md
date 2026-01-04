# Design System Token Generator - Figma Plugin Implementation Spec

## Overview

브랜드 컬러와 기본 설정만으로 DTCG(Design Tokens Community Group) 2025.10 포맷의 완전한 디자인 토큰 JSON을 생성하는 Figma 플러그인.

### 핵심 가치
- **최소 인풋, 최대 아웃풋**: Primary 컬러 + Background 컬러만으로 완전한 디자인 시스템 생성
- **표준 준수**: DTCG 2025.10 포맷으로 Figma Variables 직접 import 가능
- **지각적 정확성**: OKLCH 색 공간 기반의 균일한 팔레트 생성

---

## User Flow

```
1. System Name 입력
2. Form Factors 선택 (Web/Tablet/Mobile)
3. Brand Colors 지정
   - Primary Color (필수)
   - Background Default Color (필수)
   - Background Mode 선택 (Pure/Tinted/Custom)
   - Secondary, Accent (선택)
4. Typography 설정
   - Font Family (Primary/Secondary/Mono)
   - Base Font Size
   - Scale Ratio
5. Spacing Grid 선택 (4px/8px)
6. Corner Radius Style 선택 (Sharp/Rounded/Pill)
7. Preview → Download .tokens.json
```

---

## Project Structure

```
/figma-plugin-design-tokens
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.js
│
├── src/
│   ├── code.ts                    # Main plugin logic (Figma sandbox)
│   ├── ui.tsx                     # React UI
│   │
│   ├── types/
│   │   ├── index.ts               # All type definitions
│   │   ├── dtcg.ts                # DTCG format types
│   │   └── input.ts               # User input types
│   │
│   ├── generators/
│   │   ├── index.ts               # Main orchestrator
│   │   ├── color/
│   │   │   ├── palette.ts         # OKLCH palette generation
│   │   │   ├── semantic.ts        # Semantic color mapping
│   │   │   └── utils.ts           # Color space conversions
│   │   ├── typography/
│   │   │   ├── scale.ts           # Modular scale generation
│   │   │   ├── properties.ts      # Line-height, weight, spacing
│   │   │   └── semantic.ts        # Semantic typography mapping
│   │   ├── spacing.ts             # Spacing scale generation
│   │   ├── radius.ts              # Border radius generation
│   │   └── elevation.ts           # Shadow/elevation generation
│   │
│   ├── formatters/
│   │   └── dtcg.ts                # DTCG JSON assembly
│   │
│   └── ui/
│       ├── App.tsx
│       ├── components/
│       │   ├── ColorPicker.tsx
│       │   ├── FormFactorSelector.tsx
│       │   ├── TypographySettings.tsx
│       │   ├── SpacingSettings.tsx
│       │   ├── RadiusSettings.tsx
│       │   └── PreviewPanel.tsx
│       └── styles/
│           └── main.css
│
└── dist/                          # Build output
```

---

## Type Definitions

### Input Types (`src/types/input.ts`)

```typescript
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
```

### DTCG Types (`src/types/dtcg.ts`)

```typescript
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
```

### Internal Types

```typescript
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
```

---

## Core Algorithms

### 1. Color Palette Generation (`src/generators/color/palette.ts`)

```typescript
import { oklch, formatHex, clampChroma, type Oklch } from 'culori';

// ============================================
// CONSTANTS
// ============================================

const PALETTE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const LIGHTNESS_SCALE: Record<number, { l: number; chromaScale: number }> = {
  50:  { l: 0.97, chromaScale: 0.25 },
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
    50:  backgroundL,
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
    50:  0.97,
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

export function generateStatusPalettes(): Record<string, ColorScale> {
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
```

### 2. Semantic Color Mapping (`src/generators/color/semantic.ts`)

```typescript
// ============================================
// SEMANTIC COLOR MAPPING
// ============================================

interface SemanticColorConfig {
  backgroundL: number;
}

type ColorRef = { $value: string };

function ref(path: string): ColorRef {
  return { $value: `{color.primitive.${path}}` };
}

export function generateSemanticColors(config: SemanticColorConfig) {
  const isLightMode = config.backgroundL > 0.5;

  if (isLightMode) {
    return generateLightModeSemantics();
  } else {
    return generateDarkModeSemantics();
  }
}

function generateLightModeSemantics() {
  return {
    background: {
      $description: 'Background colors for surfaces and containers',
      default:        ref('neutral.50'),
      subtle:         ref('neutral.100'),
      muted:          ref('neutral.200'),
      inverse:        ref('neutral.900'),
      brand:          ref('primary.500'),
      'brand-subtle': ref('primary.50'),
    },
    
    text: {
      $description: 'Text colors for content',
      default:    ref('neutral.900'),
      muted:      ref('neutral.600'),
      subtle:     ref('neutral.400'),
      inverse:    ref('neutral.50'),
      brand:      ref('primary.600'),
      'on-brand': ref('neutral.50'),
    },
    
    border: {
      $description: 'Border colors for dividers and outlines',
      default: ref('neutral.200'),
      muted:   ref('neutral.100'),
      strong:  ref('neutral.300'),
      focus:   ref('primary.500'),
    },
    
    interactive: {
      $description: 'Colors for interactive elements',
      default:  ref('primary.500'),
      hover:    ref('primary.600'),
      active:   ref('primary.700'),
      disabled: ref('neutral.300'),
    },
    
    status: {
      success: {
        default: ref('green.500'),
        subtle:  ref('green.50'),
        text:    ref('green.700'),
      },
      warning: {
        default: ref('amber.500'),
        subtle:  ref('amber.50'),
        text:    ref('amber.700'),
      },
      error: {
        default: ref('red.500'),
        subtle:  ref('red.50'),
        text:    ref('red.700'),
      },
      info: {
        default: ref('blue.500'),
        subtle:  ref('blue.50'),
        text:    ref('blue.700'),
      },
    },
  };
}

function generateDarkModeSemantics() {
  return {
    background: {
      $description: 'Background colors for surfaces and containers',
      default:        ref('neutral.900'),
      subtle:         ref('neutral.800'),
      muted:          ref('neutral.700'),
      inverse:        ref('neutral.50'),
      brand:          ref('primary.600'),
      'brand-subtle': ref('primary.900'),
    },
    
    text: {
      $description: 'Text colors for content',
      default:    ref('neutral.50'),
      muted:      ref('neutral.400'),
      subtle:     ref('neutral.500'),
      inverse:    ref('neutral.900'),
      brand:      ref('primary.400'),
      'on-brand': ref('neutral.900'),
    },
    
    border: {
      $description: 'Border colors for dividers and outlines',
      default: ref('neutral.700'),
      muted:   ref('neutral.800'),
      strong:  ref('neutral.600'),
      focus:   ref('primary.400'),
    },
    
    interactive: {
      $description: 'Colors for interactive elements',
      default:  ref('primary.500'),
      hover:    ref('primary.400'),
      active:   ref('primary.300'),
      disabled: ref('neutral.600'),
    },
    
    status: {
      success: {
        default: ref('green.400'),
        subtle:  ref('green.900'),
        text:    ref('green.300'),
      },
      warning: {
        default: ref('amber.400'),
        subtle:  ref('amber.900'),
        text:    ref('amber.300'),
      },
      error: {
        default: ref('red.400'),
        subtle:  ref('red.900'),
        text:    ref('red.300'),
      },
      info: {
        default: ref('blue.400'),
        subtle:  ref('blue.900'),
        text:    ref('blue.300'),
      },
    },
  };
}
```

### 3. Typography Scale Generation (`src/generators/typography/scale.ts`)

```typescript
// ============================================
// TYPOGRAPHY SCALE GENERATION
// ============================================

import type { FormFactor, ScaleRatio, SemanticRole, DTCGTypographyValue } from '../types';

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
  title:   { default: 600, strong: 700, subtle: 500 },
  body:    { default: 400, strong: 600, subtle: 400 },
  label:   { default: 500, strong: 600, subtle: 400 },
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
  title:   { web: 1.0, tablet: 0.95, mobile: 0.90 },
  body:    { web: 1.0, tablet: 1.00, mobile: 1.00 },
  label:   { web: 1.0, tablet: 1.00, mobile: 1.00 },
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
```

### 4. Typography Semantic Generation (`src/generators/typography/semantic.ts`)

```typescript
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
  'display.xl':  { scaleStep: 5, role: 'display', family: 'heading', emphasis: 'default' },
  'display.lg':  { scaleStep: 4, role: 'display', family: 'heading', emphasis: 'default' },
  'display.md':  { scaleStep: 3, role: 'display', family: 'heading', emphasis: 'default' },
  'display.sm':  { scaleStep: 2, role: 'display', family: 'heading', emphasis: 'default' },
  
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
  'code.block':  { scaleStep: -1, role: 'body', family: 'mono', emphasis: 'default' },
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
```

### 5. Spacing Generation (`src/generators/spacing.ts`)

```typescript
// ============================================
// SPACING SCALE GENERATION
// ============================================

import type { GridUnit, DTCGDimensionValue } from '../types';

interface SpacingToken {
  $value: DTCGDimensionValue;
  $description?: string;
}

export function generateSpacingScale(gridUnit: GridUnit): Record<string, SpacingToken> {
  const multipliers = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  
  const scale: Record<string, SpacingToken> = {};
  
  for (const mult of multipliers) {
    const value = gridUnit * mult;
    const key = mult === 0 ? '0' 
      : mult % 1 === 0 ? String(mult) 
      : String(mult).replace('.', '-');
    
    scale[key] = {
      $value: { value, unit: 'px' },
    };
  }

  // Add semantic aliases
  const semanticSpacing: Record<string, string> = {
    'none': '0',
    'xs': '1',
    'sm': '2',
    'md': '4',
    'lg': '6',
    'xl': '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '24',
  };

  for (const [semantic, scaleKey] of Object.entries(semanticSpacing)) {
    if (scale[scaleKey]) {
      scale[`semantic.${semantic}`] = {
        $value: `{spacing.${scaleKey}}` as unknown as DTCGDimensionValue,
      };
    }
  }

  return scale;
}
```

### 6. Radius Generation (`src/generators/radius.ts`)

```typescript
// ============================================
// BORDER RADIUS GENERATION
// ============================================

import type { RadiusStyle, DTCGDimensionValue } from '../types';

interface RadiusToken {
  $value: DTCGDimensionValue;
  $description?: string;
}

const RADIUS_SCALES: Record<RadiusStyle, Record<string, number>> = {
  sharp: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    '2xl': 12,
    full: 9999,
  },
  rounded: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  pill: {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    full: 9999,
  },
};

export function generateRadiusScale(style: RadiusStyle): Record<string, RadiusToken> {
  const values = RADIUS_SCALES[style];
  const scale: Record<string, RadiusToken> = {};

  for (const [key, value] of Object.entries(values)) {
    scale[key] = {
      $value: { value, unit: 'px' },
    };
  }

  return scale;
}
```

### 7. Elevation/Shadow Generation (`src/generators/elevation.ts`)

```typescript
// ============================================
// ELEVATION (SHADOW) GENERATION
// ============================================

import type { DTCGShadowValue } from '../types';

interface ElevationConfig {
  isLightMode: boolean;
}

interface ElevationToken {
  $value: DTCGShadowValue | DTCGShadowValue[];
  $description?: string;
}

export function generateElevationScale(config: ElevationConfig): Record<string, ElevationToken> {
  const shadowColor = config.isLightMode
    ? { colorSpace: 'srgb' as const, components: [0, 0, 0] as [number, number, number], alpha: 0.1 }
    : { colorSpace: 'srgb' as const, components: [0, 0, 0] as [number, number, number], alpha: 0.3 };

  return {
    none: {
      $value: {
        color: { ...shadowColor, alpha: 0 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 0, unit: 'px' },
        blur: { value: 0, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
      $description: 'No elevation',
    },
    
    sm: {
      $value: {
        color: shadowColor,
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 1, unit: 'px' },
        blur: { value: 2, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
      $description: 'Small elevation for subtle depth',
    },
    
    md: {
      $value: [
        {
          color: shadowColor,
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 2, unit: 'px' },
          blur: { value: 4, unit: 'px' },
          spread: { value: -1, unit: 'px' },
        },
        {
          color: { ...shadowColor, alpha: shadowColor.alpha! * 0.6 },
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 4, unit: 'px' },
          blur: { value: 6, unit: 'px' },
          spread: { value: -1, unit: 'px' },
        },
      ],
      $description: 'Medium elevation for cards',
    },
    
    lg: {
      $value: [
        {
          color: shadowColor,
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 4, unit: 'px' },
          blur: { value: 6, unit: 'px' },
          spread: { value: -2, unit: 'px' },
        },
        {
          color: { ...shadowColor, alpha: shadowColor.alpha! * 0.5 },
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 10, unit: 'px' },
          blur: { value: 15, unit: 'px' },
          spread: { value: -3, unit: 'px' },
        },
      ],
      $description: 'Large elevation for modals',
    },
    
    xl: {
      $value: [
        {
          color: shadowColor,
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 8, unit: 'px' },
          blur: { value: 10, unit: 'px' },
          spread: { value: -4, unit: 'px' },
        },
        {
          color: { ...shadowColor, alpha: shadowColor.alpha! * 0.4 },
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 20, unit: 'px' },
          blur: { value: 25, unit: 'px' },
          spread: { value: -5, unit: 'px' },
        },
      ],
      $description: 'Extra large elevation for popovers',
    },
  };
}
```

---

## DTCG Formatter (`src/formatters/dtcg.ts`)

```typescript
// ============================================
// DTCG JSON ASSEMBLY
// ============================================

import type { 
  DTCGTokenFile, 
  DTCGColorValue,
  GeneratedPalettes,
} from '../types';

interface AssemblyInput {
  primitives: GeneratedPalettes;
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

function formatColorScale(scale: import('../types').ColorScale) {
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
```

---

## Main Generator Orchestrator (`src/generators/index.ts`)

```typescript
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
```

---

## Plugin Configuration

### manifest.json

```json
{
  "name": "Design System Token Generator",
  "id": "design-system-token-generator",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["none"]
  }
}
```

### package.json

```json
{
  "name": "figma-design-token-generator",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:code\" \"npm run dev:ui\"",
    "dev:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --watch",
    "dev:ui": "esbuild src/ui.tsx --bundle --outfile=dist/ui.js --watch",
    "build": "npm run build:code && npm run build:ui",
    "build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --minify",
    "build:ui": "esbuild src/ui.tsx --bundle --outfile=dist/ui.js --minify",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "culori": "^4.0.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.89.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "concurrently": "^8.2.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```

---

## UI Components (Abbreviated)

### Main App (`src/ui/App.tsx`)

```tsx
import React, { useState } from 'react';
import { ColorPicker } from './components/ColorPicker';
import { FormFactorSelector } from './components/FormFactorSelector';
import { TypographySettings } from './components/TypographySettings';
import { SpacingSettings } from './components/SpacingSettings';
import { RadiusSettings } from './components/RadiusSettings';
import { PreviewPanel } from './components/PreviewPanel';
import type { DesignSystemInput } from '../types';

const DEFAULT_INPUT: DesignSystemInput = {
  systemName: 'brand',
  formFactors: ['web', 'tablet', 'mobile'],
  colors: {
    primary: '#0066CC',
    background: {
      default: '#FFFFFF',
      mode: 'tinted',
    },
  },
  typography: {
    fontFamily: {
      primary: 'Inter',
    },
    baseFontSize: 16,
    scaleRatio: 1.200,
  },
  spacing: {
    gridUnit: 8,
  },
  radius: {
    style: 'rounded',
  },
};

export function App() {
  const [input, setInput] = useState<DesignSystemInput>(DEFAULT_INPUT);
  const [preview, setPreview] = useState<string | null>(null);

  const handleGenerate = () => {
    parent.postMessage({ 
      pluginMessage: { type: 'generate', payload: input } 
    }, '*');
  };

  const handleDownload = () => {
    parent.postMessage({ 
      pluginMessage: { type: 'download', payload: input } 
    }, '*');
  };

  return (
    <div className="app">
      <h1>Design System Token Generator</h1>
      
      <section>
        <h2>1. System Name</h2>
        <input 
          type="text"
          value={input.systemName}
          onChange={(e) => setInput({ ...input, systemName: e.target.value })}
        />
      </section>

      <section>
        <h2>2. Form Factors</h2>
        <FormFactorSelector 
          value={input.formFactors}
          onChange={(formFactors) => setInput({ ...input, formFactors })}
        />
      </section>

      <section>
        <h2>3. Brand Colors</h2>
        <ColorPicker
          label="Primary"
          value={input.colors.primary}
          onChange={(primary) => setInput({ 
            ...input, 
            colors: { ...input.colors, primary } 
          })}
        />
        <ColorPicker
          label="Background Default"
          value={input.colors.background.default}
          onChange={(value) => setInput({ 
            ...input, 
            colors: { 
              ...input.colors, 
              background: { ...input.colors.background, default: value } 
            } 
          })}
        />
        {/* Background mode selector */}
        {/* Secondary, Accent optional pickers */}
      </section>

      <section>
        <h2>4. Typography</h2>
        <TypographySettings
          value={input.typography}
          onChange={(typography) => setInput({ ...input, typography })}
        />
      </section>

      <section>
        <h2>5. Spacing</h2>
        <SpacingSettings
          value={input.spacing}
          onChange={(spacing) => setInput({ ...input, spacing })}
        />
      </section>

      <section>
        <h2>6. Corner Radius</h2>
        <RadiusSettings
          value={input.radius}
          onChange={(radius) => setInput({ ...input, radius })}
        />
      </section>

      <div className="actions">
        <button onClick={handleGenerate}>Preview JSON</button>
        <button onClick={handleDownload} className="primary">
          Download .tokens.json
        </button>
      </div>

      {preview && <PreviewPanel json={preview} />}
    </div>
  );
}
```

---

## Usage Example

### Input

```typescript
const input: DesignSystemInput = {
  systemName: 'acme',
  formFactors: ['web', 'tablet', 'mobile'],
  colors: {
    primary: '#6366F1',  // Indigo
    background: {
      default: '#FAFAF9',  // Warm white
      mode: 'tinted',
    },
    accent: '#10B981',  // Emerald
  },
  typography: {
    fontFamily: {
      primary: 'Inter',
      secondary: 'Cal Sans',
      mono: 'JetBrains Mono',
    },
    baseFontSize: 16,
    scaleRatio: 1.250,  // Major Third
  },
  spacing: {
    gridUnit: 8,
  },
  radius: {
    style: 'rounded',
  },
};
```

### Output (Abbreviated)

```json
{
  "color": {
    "$type": "color",
    "primitive": {
      "primary": {
        "50": { "$value": { "colorSpace": "srgb", "components": [0.95, 0.95, 0.99], "hex": "#F2F2FC" } },
        "500": { "$value": { "colorSpace": "srgb", "components": [0.39, 0.40, 0.95], "hex": "#6366F1" } },
        "900": { "$value": { "colorSpace": "srgb", "components": [0.15, 0.16, 0.38], "hex": "#262961" } }
      },
      "neutral": {
        "50": { "$value": { "colorSpace": "srgb", "components": [0.98, 0.98, 0.97], "hex": "#FAFAF9" } }
      }
    },
    "semantic": {
      "background": {
        "default": { "$value": "{color.primitive.neutral.50}" }
      },
      "text": {
        "default": { "$value": "{color.primitive.neutral.900}" }
      },
      "interactive": {
        "default": { "$value": "{color.primitive.primary.500}" }
      }
    }
  },
  "typography": {
    "$type": "typography",
    "heading": {
      "h1": {
        "web": {
          "$value": {
            "fontFamily": ["Cal Sans", "system-ui", "sans-serif"],
            "fontSize": { "value": 48, "unit": "px" },
            "fontWeight": 600,
            "lineHeight": 1.2,
            "letterSpacing": { "value": -0.02, "unit": "em" }
          }
        }
      }
    },
    "body": {
      "md": {
        "web": {
          "$value": {
            "fontFamily": ["Inter", "system-ui", "sans-serif"],
            "fontSize": { "value": 16, "unit": "px" },
            "fontWeight": 400,
            "lineHeight": 1.6,
            "letterSpacing": { "value": 0, "unit": "em" }
          }
        }
      }
    }
  },
  "spacing": {
    "$type": "dimension",
    "4": { "$value": { "value": 32, "unit": "px" } }
  },
  "radius": {
    "$type": "dimension",
    "md": { "$value": { "value": 8, "unit": "px" } }
  },
  "elevation": {
    "$type": "shadow",
    "md": {
      "$value": [
        {
          "color": { "colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.1 },
          "offsetX": { "value": 0, "unit": "px" },
          "offsetY": { "value": 2, "unit": "px" },
          "blur": { "value": 4, "unit": "px" },
          "spread": { "value": -1, "unit": "px" }
        }
      ]
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Core (Week 1-2)
- [ ] Project setup (manifest, package.json, esbuild)
- [ ] Type definitions
- [ ] Color palette generator (OKLCH)
- [ ] Semantic color mapper
- [ ] DTCG JSON formatter
- [ ] Basic UI (color pickers, form)
- [ ] Download functionality

### Phase 2: Typography (Week 3)
- [ ] Modular scale generator
- [ ] Line height/weight algorithms
- [ ] Responsive typography
- [ ] Semantic typography mapper
- [ ] Font family input with presets

### Phase 3: Polish (Week 4)
- [ ] Spacing/Radius/Elevation generators
- [ ] JSON preview panel
- [ ] Form validation
- [ ] Error handling
- [ ] UI styling

### Phase 4: Advanced (Optional)
- [ ] Figma Variables direct import (Plugin API)
- [ ] Dark mode auto-generation
- [ ] Style Dictionary config export
- [ ] Token diff comparison
- [ ] Preset templates (Material, Tailwind-like)

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| culori | ^4.0.1 | OKLCH color manipulation |
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | React DOM |
| @figma/plugin-typings | ^1.89.0 | Figma API types |
| esbuild | ^0.19.0 | Bundler |
| typescript | ^5.0.0 | Type checking |

---

## References

- [DTCG 2025.10 Specification](https://www.designtokens.org/tr/2025.10/format/)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Figma Variables Import](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [OKLCH Color Space](https://oklch.com/)
- [Culori Library](https://culorijs.org/)
