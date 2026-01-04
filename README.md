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

### Verification

Build output:
- `dist/code.js` - 757 bytes
- `dist/ui.js` - 1.0 MB (includes React)
- `dist/ui.css` - 3.6 KB
- `dist/ui.html` - 497 bytes

The manifest correctly references `dist/ui.html` and the UI should load without issues.

## Next Steps (Day 2)

- Implement color palette generators
- Implement typography scale generators
- Create token orchestrator
- Connect generators to UI
