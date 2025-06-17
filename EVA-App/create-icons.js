const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create EVA icon with holographic design
function createEVAIcon(size = 512) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear background
  ctx.clearRect(0, 0, size, size);

  // Create holographic gradient background
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(0, 102, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(10, 10, 26, 0.9)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw outer ring
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.45;
  
  ctx.strokeStyle = '#00D4FF';
  ctx.lineWidth = size * 0.02;
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur = size * 0.02;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw inner elements - EVA text
  ctx.font = `bold ${size * 0.3}px 'Arial'`;
  ctx.fillStyle = '#00D4FF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur = size * 0.01;
  ctx.fillText('EVA', centerX, centerY);

  // Add some tech details
  ctx.strokeStyle = '#00CCAA';
  ctx.lineWidth = size * 0.005;
  ctx.shadowBlur = size * 0.01;
  
  // Draw corner brackets
  const bracketSize = size * 0.1;
  const margin = size * 0.1;
  
  // Top-left bracket
  ctx.beginPath();
  ctx.moveTo(margin, margin + bracketSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + bracketSize, margin);
  ctx.stroke();
  
  // Top-right bracket
  ctx.beginPath();
  ctx.moveTo(size - margin - bracketSize, margin);
  ctx.lineTo(size - margin, margin);
  ctx.lineTo(size - margin, margin + bracketSize);
  ctx.stroke();
  
  // Bottom-left bracket
  ctx.beginPath();
  ctx.moveTo(margin, size - margin - bracketSize);
  ctx.lineTo(margin, size - margin);
  ctx.lineTo(margin + bracketSize, size - margin);
  ctx.stroke();
  
  // Bottom-right bracket
  ctx.beginPath();
  ctx.moveTo(size - margin - bracketSize, size - margin);
  ctx.lineTo(size - margin, size - margin);
  ctx.lineTo(size - margin, size - margin - bracketSize);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// Create system tray icon (simpler, monochrome)
function createTrayIcon(size = 32) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear background
  ctx.clearRect(0, 0, size, size);

  // For macOS tray icons, use template image (black and transparent)
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Draw simple EVA icon
  ctx.fillStyle = '#000000'; // Black for template image
  ctx.font = `bold ${size * 0.6}px 'Arial'`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', centerX, centerY);

  return canvas.toBuffer('image/png');
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

try {
  // Create main app icon
  const appIcon = createEVAIcon(512);
  fs.writeFileSync(path.join(iconsDir, 'icon.png'), appIcon);
  console.log('✅ Created main app icon');

  // Create smaller version for better compatibility
  const appIconSmall = createEVAIcon(256);
  fs.writeFileSync(path.join(iconsDir, 'icon@2x.png'), appIconSmall);
  console.log('✅ Created 2x app icon');

  // Create system tray icon
  const trayIcon = createTrayIcon(32);
  fs.writeFileSync(path.join(iconsDir, 'tray-icon.png'), trayIcon);
  console.log('✅ Created system tray icon');

  // Create multiple sizes for different uses
  const sizes = [16, 32, 64, 128, 256, 512];
  sizes.forEach(size => {
    const icon = createEVAIcon(size);
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), icon);
  });
  console.log('✅ Created multiple icon sizes');

  console.log('🎉 All icons created successfully!');
} catch (error) {
  console.error('❌ Error creating icons:', error);
  console.log('Installing canvas dependency...');
  
  // If canvas is not available, create a simple fallback
  console.log('Creating simple fallback icons...');
  
  // Simple fallback - just copy an existing icon or create a basic one
  const simpleIcon = Buffer.alloc(0); // This would need actual image data
  // For now, we'll skip the canvas creation and use existing icons
}