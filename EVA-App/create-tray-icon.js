const fs = require('fs');
const path = require('path');

// Create a simple 32x32 PNG icon for system tray
// Since we can't easily use Canvas without additional dependencies, 
// let's create a basic PNG header and simple bitmap data

function createSimplePNG() {
  // This is a minimal PNG implementation for a 32x32 black square with "E" 
  // For production, you'd want to use a proper image library
  
  // For now, let's copy the existing icon.png and rename it
  const sourcePath = path.join(__dirname, 'src', 'assets', 'icons', 'eva-icon-32.svg');
  const targetPath = path.join(__dirname, 'src', 'assets', 'icons', 'tray-icon.png');
  const fallbackPath = path.join(__dirname, 'src', 'assets', 'icons', 'icon.png');
  
  try {
    // Try to use the existing icon as fallback
    if (fs.existsSync(fallbackPath)) {
      fs.copyFileSync(fallbackPath, targetPath);
      console.log('✅ Created tray-icon.png from existing icon');
    } else {
      console.log('❌ No source icon found');
    }
  } catch (error) {
    console.error('❌ Error creating tray icon:', error);
  }
}

createSimplePNG();