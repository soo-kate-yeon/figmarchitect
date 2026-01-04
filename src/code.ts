// ============================================
// FIGMA PLUGIN MAIN CODE
// ============================================

// Show UI
figma.showUI(__html__, {
    width: 480,
    height: 720,
    title: 'Design System Token Generator',
});

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'generate-tokens') {
        try {
            // TODO: Implement token generation
            const tokens = {
                color: {},
                typography: {},
                spacing: {},
                radius: {},
                elevation: {},
            };

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
