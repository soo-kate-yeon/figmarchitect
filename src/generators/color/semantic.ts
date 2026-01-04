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
            default: ref('neutral.50'),
            subtle: ref('neutral.100'),
            muted: ref('neutral.200'),
            inverse: ref('neutral.900'),
            brand: ref('primary.500'),
            'brand-subtle': ref('primary.50'),
        },

        text: {
            $description: 'Text colors for content',
            default: ref('neutral.900'),
            muted: ref('neutral.600'),
            subtle: ref('neutral.400'),
            inverse: ref('neutral.50'),
            brand: ref('primary.600'),
            'on-brand': ref('neutral.50'),
        },

        border: {
            $description: 'Border colors for dividers and outlines',
            default: ref('neutral.200'),
            muted: ref('neutral.100'),
            strong: ref('neutral.300'),
            focus: ref('primary.500'),
        },

        interactive: {
            $description: 'Colors for interactive elements',
            default: ref('primary.500'),
            hover: ref('primary.600'),
            active: ref('primary.700'),
            disabled: ref('neutral.300'),
        },

        status: {
            success: {
                default: ref('green.500'),
                subtle: ref('green.50'),
                text: ref('green.700'),
            },
            warning: {
                default: ref('amber.500'),
                subtle: ref('amber.50'),
                text: ref('amber.700'),
            },
            error: {
                default: ref('red.500'),
                subtle: ref('red.50'),
                text: ref('red.700'),
            },
            info: {
                default: ref('blue.500'),
                subtle: ref('blue.50'),
                text: ref('blue.700'),
            },
        },
    };
}

function generateDarkModeSemantics() {
    return {
        background: {
            $description: 'Background colors for surfaces and containers',
            default: ref('neutral.900'),
            subtle: ref('neutral.800'),
            muted: ref('neutral.700'),
            inverse: ref('neutral.50'),
            brand: ref('primary.600'),
            'brand-subtle': ref('primary.900'),
        },

        text: {
            $description: 'Text colors for content',
            default: ref('neutral.50'),
            muted: ref('neutral.400'),
            subtle: ref('neutral.500'),
            inverse: ref('neutral.900'),
            brand: ref('primary.400'),
            'on-brand': ref('neutral.900'),
        },

        border: {
            $description: 'Border colors for dividers and outlines',
            default: ref('neutral.700'),
            muted: ref('neutral.800'),
            strong: ref('neutral.600'),
            focus: ref('primary.400'),
        },

        interactive: {
            $description: 'Colors for interactive elements',
            default: ref('primary.500'),
            hover: ref('primary.400'),
            active: ref('primary.300'),
            disabled: ref('neutral.600'),
        },

        status: {
            success: {
                default: ref('green.400'),
                subtle: ref('green.900'),
                text: ref('green.300'),
            },
            warning: {
                default: ref('amber.400'),
                subtle: ref('amber.900'),
                text: ref('amber.300'),
            },
            error: {
                default: ref('red.400'),
                subtle: ref('red.900'),
                text: ref('red.300'),
            },
            info: {
                default: ref('blue.400'),
                subtle: ref('blue.900'),
                text: ref('blue.300'),
            },
        },
    };
}
