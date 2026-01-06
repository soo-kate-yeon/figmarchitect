// ============================================
// FIGMA PLUGIN MAIN CODE
// ============================================

import { applyAllVariables } from './figma/variablesConverter';
import { createTextStyles } from './figma/textStylesConverter';

// Show UI
// Show UI with desktop-first defaults
figma.showUI(__html__, {
    width: 1000,
    height: 800,
    title: 'Design System Token Generator',
});

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
    // Handle manual resizing from UI
    if (msg.type === 'resize') {
        figma.ui.resize(msg.width, msg.height);
    }

    if (msg.type === 'generate-tokens') {
        try {
            // Import generator (dynamic import for Figma sandbox)
            const { generateDesignTokens } = await import('./generators/index');

            // Generate tokens from user input
            const tokens = generateDesignTokens(msg.input);

            figma.ui.postMessage({
                type: 'tokens-generated',
                tokens,
            });
        } catch (error) {
            figma.ui.postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    // Apply tokens as Figma Variables
    if (msg.type === 'apply-to-figma') {
        try {
            const result = await applyAllVariables(msg.tokens, msg.systemName || 'Design Tokens');

            figma.ui.postMessage({
                type: 'variables-applied',
                result,
            });

            if (result.success) {
                figma.notify(`✅ Created ${result.variablesCreated} variables in ${result.collectionsCreated} collections`);
            } else {
                figma.notify(`⚠️ Partial success: ${result.variablesCreated} variables created, ${result.errors.length} errors`);
            }
        } catch (error) {
            figma.ui.postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to apply variables',
            });
            figma.notify('❌ Failed to create variables');
        }
    }

    // Create Text Styles from typography tokens
    if (msg.type === 'create-text-styles') {
        try {
            const result = await createTextStyles(msg.tokens, msg.formFactor || 'web');

            figma.ui.postMessage({
                type: 'text-styles-created',
                result,
            });

            if (result.success) {
                figma.notify(`✅ Created ${result.stylesCreated} text styles (fonts: ${result.fontsLoaded.join(', ')})`);
            } else {
                figma.notify(`⚠️ Partial success: ${result.stylesCreated} styles created, ${result.errors.length} errors`);
            }
        } catch (error) {
            figma.ui.postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to create text styles',
            });
            figma.notify('❌ Failed to create text styles');
        }
    }

    if (msg.type === 'download-tokens') {
        // User will handle download in browser
        console.log('Download requested');
    }

    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
