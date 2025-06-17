/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('🚀 EVA Renderer starting...');
console.log('🔍 Checking electronAPI availability:', typeof window.electronAPI);
console.log('🔍 electronAPI auth:', window.electronAPI?.auth);
console.log('🔍 electronAPI esi:', window.electronAPI?.esi);

const container = document.getElementById('app');
if (container) {
  console.log('✅ Found root element, creating React root...');
  
  try {
    const root = createRoot(container);
    console.log('✅ React root created, rendering test component...');
    
    // Test with simple component first
    const TestComponent = React.createElement('div', { 
      style: { 
        padding: '20px', 
        backgroundColor: '#2a2a2a', 
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      } 
    }, 'EVA Test - Renderer Working!');
    
    root.render(TestComponent);
    console.log('✅ Test component rendered successfully');
    
    // electronAPI is available, load main app immediately
    const loadMainApp = async () => {
      try {
        console.log('📦 Loading main App component...');
        const { default: App } = await import('./renderer/App');
        console.log('✅ App component loaded, rendering...');
        root.render(React.createElement(App));
        console.log('✅ Main app rendered successfully');
      } catch (error) {
        console.error('❌ Failed to load/render main App:', error);
        const errorComponent = React.createElement('div', {
          style: { 
            padding: '20px', 
            backgroundColor: '#d32f2f', 
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }
        }, `Error loading app: ${error.message}`);
        root.render(errorComponent);
      }
    };
    
    // Give test component 2 seconds to display, then load main app
    setTimeout(loadMainApp, 2000);
    
  } catch (error) {
    console.error('❌ Failed to create React root:', error);
    container.innerHTML = `<div style="padding: 20px; background: #d32f2f; color: white;">React Error: ${error.message}</div>`;
  }
} else {
  console.error('❌ Failed to find the root element');
}