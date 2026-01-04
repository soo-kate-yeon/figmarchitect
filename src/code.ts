// ============================================
// FIGMA PLUGIN MAIN CODE
// ============================================

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


    if (msg.type === 'download-tokens') {
        // User will handle download in browser
        console.log('Download requested');
    }

    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
