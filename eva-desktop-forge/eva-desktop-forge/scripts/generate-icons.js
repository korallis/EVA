const fs = require('fs');
const path = require('path');

// Simple script to create a basic PNG icon from our SVG
// For a quick solution, we'll create a simple icon programmatically

const iconSizes = [16, 32, 48, 64, 128, 256, 512];
const assetsDir = path.join(__dirname, '../src/assets');
const iconsDir = path.join(assetsDir, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple EVA icon using Canvas (if available) or generate programmatically
// For now, let's create a simple square icon with EVA text

console.log('📦 Generating EVA icons...');

// Create a simple fallback icon (we'll improve this)
const createSimpleIcon = (size) => {
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF8C00"/>
        <stop offset="100%" stop-color="#FF4500"/>
      </linearGradient>
      <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#E0E0E0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="12" fill="url(#bg)"/>
    <rect width="90%" height="90%" x="5%" y="5%" rx="8" fill="none" stroke="#00BFFF" stroke-width="2"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
          font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.3}" fill="url(#text)">EVA</text>
  </svg>`;
  
  return canvas;
};

// Generate SVG icons for different sizes
iconSizes.forEach(size => {
  const iconContent = createSimpleIcon(size);
  const iconPath = path.join(iconsDir, `eva-icon-${size}.svg`);
  fs.writeFileSync(iconPath, iconContent);
  console.log(`✅ Generated ${size}x${size} icon`);
});

// Copy the main icon to expected locations
const mainIcon = createSimpleIcon(512);
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), mainIcon);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), mainIcon); // SVG as PNG for now

console.log('🎉 Icon generation complete!');
console.log('📁 Icons saved to:', iconsDir);

// Instructions for manual conversion
console.log('\n📝 Next steps:');
console.log('1. For best results, convert SVG icons to PNG/ICO/ICNS using:');
console.log('   - Online: https://cloudconvert.com or https://favicon.io');
console.log('   - macOS: brew install imagemagick && convert icon.svg icon.png');
console.log('2. Rebuild the app: npm run make');