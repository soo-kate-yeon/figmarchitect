const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Generate ui.html wrapper with inlined JS
function generateUIHTML() {
    // Read the bundled ui.js content
    const uiJsPath = path.join(__dirname, 'dist', 'ui.js');
    let uiJsContent = '';

    if (fs.existsSync(uiJsPath)) {
        uiJsContent = fs.readFileSync(uiJsPath, 'utf8');
    }

    // Read CSS if it exists
    const uiCssPath = path.join(__dirname, 'dist', 'ui.css');
    let uiCssContent = '';

    if (fs.existsSync(uiCssPath)) {
        uiCssContent = fs.readFileSync(uiCssPath, 'utf8');
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Design System Token Generator</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    #root {
      width: 100%;
      height: 100vh;
    }
    ${uiCssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>${uiJsContent}</script>
</body>
</html>`;

    fs.writeFileSync('dist/ui.html', html);
    return html;
}

// Plugin to inline HTML
const inlineHTMLPlugin = {
    name: 'inline-html',
    setup(build) {
        build.onLoad({ filter: /\.ts$/ }, async (args) => {
            if (!args.path.endsWith('code.ts')) return;

            const source = await fs.promises.readFile(args.path, 'utf8');

            // Generate HTML
            const html = generateUIHTML();

            // Replace __html__ with actual HTML string
            const transformed = source.replace(
                '__html__',
                JSON.stringify(html)
            );

            return {
                contents: transformed,
                loader: 'ts',
            };
        });
    },
};

// Build configuration for plugin code (runs in Figma sandbox)
const codeConfig = {
    entryPoints: ['src/code.ts'],
    bundle: true,
    outfile: 'dist/code.js',
    platform: 'node',
    target: 'es2020',
    logLevel: 'info',
    plugins: [inlineHTMLPlugin],
};

// Build configuration for UI (runs in iframe)
const uiConfig = {
    entryPoints: ['src/ui/App.tsx'],
    bundle: true,
    outfile: 'dist/ui.js',
    platform: 'browser',
    target: 'es2020',
    format: 'iife', // Self-contained bundle, no module loaders
    minify: false, // Keep readable for debugging
    treeShaking: true,
    define: {
        'process.env.NODE_ENV': '"production"',
        'global': 'window',
    },
    loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
    },
    logLevel: 'info',
};

async function build() {
    try {
        // Build ui.js first
        await esbuild.build(uiConfig);
        console.log('✓ Built dist/ui.js');

        // Build code.js (will generate ui.html via plugin)
        await esbuild.build(codeConfig);
        console.log('✓ Built dist/code.js');
        console.log('✓ Generated dist/ui.html');

        console.log('\n✅ Build complete!\n');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

async function watch() {
    try {
        // Watch ui.js
        const uiContext = await esbuild.context(uiConfig);
        await uiContext.watch();
        console.log('👀 Watching src/ui/App.tsx...');

        // Watch code.js
        const codeContext = await esbuild.context(codeConfig);
        await codeContext.watch();
        console.log('👀 Watching src/code.ts...');

        console.log('\n✅ Watch mode active!\n');
    } catch (error) {
        console.error('❌ Watch failed:', error);
        process.exit(1);
    }
}

if (isWatch) {
    watch();
} else {
    build();
}
