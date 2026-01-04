# Design System Token Generator

Figma plugin that generates complete DTCG 2025.10 format design tokens from minimal user input.

## Features

- **Minimal Input**: Just provide brand colors and basic settings
- **DTCG 2025.10 Compliant**: Direct import to Figma Variables
- **OKLCH Color Space**: Perceptually uniform color palettes
- **Responsive Typography**: Automatic scaling for web/tablet/mobile
- **Complete System**: Colors, typography, spacing, radius, elevation

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Load in Figma

1. Open Figma Desktop
2. Go to `Plugins → Development → Import Plugin from Manifest...`
3. Select `manifest.json` from this directory
4. The plugin UI should open successfully

## Project Structure

```
/figmarchitect
├── manifest.json          # Figma plugin manifest
├── src/
│   ├── code.ts           # Main plugin logic
│   ├── ui/
│   │   ├── App.tsx       # React UI
│   │   └── styles/
│   │       └── main.css  # UI styles
│   ├── types/            # TypeScript definitions
│   ├── generators/       # Token generation logic
│   └── formatters/       # DTCG JSON assembly
└── dist/                 # Build output
    ├── code.js
    ├── ui.js
    ├── ui.css
    └── ui.html
```

## Day 1 Completed ✅

- ✅ Project scaffold setup
- ✅ Build configuration (esbuild)
- ✅ Type definitions (input, DTCG, internal)
- ✅ Plugin main code (`code.ts`)
- ✅ UI skeleton with multi-step form
- ✅ CSS styling
- ✅ Successful build verification

## Day 2 Completed ✅

- ✅ Color palette generators (OKLCH-based)
- ✅ Typography scale generators (modular scale, responsive)
- ✅ Spacing, radius, elevation generators
- ✅ Token orchestrator
- ✅ DTCG formatter
- ✅ UI integration
- ✅ Build verification

### Build Output

- `dist/code.js` - 437.2 KB
- `dist/ui.js` - 274.0 KB
- `dist/ui.css` - 3.6 KB
- `dist/ui.html` - Generated

## Next Steps (Day 3)

- Test plugin in Figma Desktop
- Verify token generation with various inputs
- Test JSON download functionality
- Validate DTCG 2025.10 format compliance
- Optional: Add Figma Variables import feature
