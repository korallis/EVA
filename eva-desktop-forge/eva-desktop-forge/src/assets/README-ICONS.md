# EVA Desktop App Icons

This directory contains icon assets for the EVA Desktop application, designed to match the EVE Online aesthetic.

## Current Assets

### eva-icon.svg
- **Format**: SVG (Scalable Vector Graphics)
- **Size**: 512x512 viewport
- **Design**: Futuristic EVE Online-inspired design with:
  - "EVA" text with orange gradient (EVE's signature color)
  - Deep space background gradient
  - Holographic blue border and tech elements
  - Neural network connection points
  - Geometric corner details

## Required Icon Formats

For full platform support, you'll need:

- **eva-icon.ico** - Windows icon (multi-resolution: 16, 32, 48, 64, 128, 256px)
- **eva-icon.icns** - macOS icon (multi-resolution: 16, 32, 64, 128, 256, 512px)  
- **eva-icon.png** - Linux/general use (512x512 recommended)

## Generating Icons

### Option 1: Use the provided script
```bash
node scripts/generate-icons.js
```

**Requirements:**
- ImageMagick (`brew install imagemagick` on macOS)
- png2icns (`npm install -g png2icns`)

### Option 2: Online converters
1. Upload `eva-icon.svg` to:
   - [CloudConvert](https://cloudconvert.com) for SVG → ICO/ICNS/PNG
   - [Favicon.io](https://favicon.io/favicon-converter/) for ICO generation
   - [IconVertigo](https://iconvertigo.com/) for ICNS generation

### Option 3: Design tools
- **Figma**: Import SVG, export as needed formats
- **Adobe Illustrator**: Export for screens with multiple sizes
- **Sketch**: Export in various resolutions

## Configuration

The icon is configured in `forge.config.ts`:
```typescript
packagerConfig: {
  icon: './src/assets/eva-icon', // Electron auto-detects format
  // ...
}
```

## Design Specifications

### Colors
- **Primary Orange**: #FF8C00, #FFA500 (EVE's signature color)
- **Secondary Blue**: #00BFFF, #1E90FF (tech/holographic)
- **Accent Cyan**: #00FFFF (neural connections)
- **Background**: Dark space gradient (#1a1a2e to #000000)

### Style Guidelines
- Futuristic, angular typography
- High contrast for small sizes
- Works on both light and dark backgrounds
- Geometric, tech-inspired elements
- Subtle glow effects for premium feel

## Testing

After generating icons, test by:
1. Building the Electron app: `npm run make`
2. Checking the built app's icon in file explorer/finder
3. Testing on different platforms if possible
4. Verifying icon appears correctly in taskbar/dock

## Customization

To modify the icon:
1. Edit `eva-icon.svg` directly
2. Regenerate platform-specific formats
3. Test the updated icons
4. Consider professional design tools for complex changes