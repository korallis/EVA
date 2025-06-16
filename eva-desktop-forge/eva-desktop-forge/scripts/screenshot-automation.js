// screenshot-automation.js
// Easily removable script to automate screenshots of each main view in EVA

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../../docs/screenshots');
const VIEWS = ['home', 'skills', 'training', 'character', 'fitting'];

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  ensureDirSync(SCREENSHOT_DIR);
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await win.loadURL('http://localhost:3000'); // Or your prod URL
  await delay(2000); // Wait for app to load

  for (const view of VIEWS) {
    // Send message to renderer to switch view
    await win.webContents.executeJavaScript(`window.setActiveView && window.setActiveView('${view}')`);
    await delay(1200); // Wait for view to render
    const image = await win.webContents.capturePage();
    const filePath = path.join(SCREENSHOT_DIR, `${view}.png`);
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`Captured screenshot: ${filePath}`);
  }
  app.quit();
});

// To remove: simply delete this file and any code referencing it.
