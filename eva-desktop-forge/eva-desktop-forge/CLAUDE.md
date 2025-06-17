# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EVA (EVE Virtual Assistant) is a **native cross-platform desktop application** built with **Electron Forge** for EVE Online players. This is **NOT a website or web application** - it is a fully native desktop app that integrates with the ESI API to provide comprehensive character management and overview functionality.

## ⚠️ CRITICAL: This is an Electron Desktop Application

**ALL CODE MUST BE WRITTEN FOR ELECTRON FORGE DESKTOP APP ARCHITECTURE:**

- ✅ **Main Process (Node.js)**: Backend services, ESI API calls, file system access
- ✅ **Renderer Process (React)**: Frontend UI running in Electron webview
- ✅ **Preload Script**: Secure IPC bridge between main and renderer
- ✅ **Native Desktop Features**: File system, notifications, system tray, URL schemes
- ✅ **Electron-specific APIs**: `ipcMain`, `ipcRenderer`, `contextBridge`, `app`, `BrowserWindow`
- ❌ **NOT a website**: No server-side rendering, no web deployment, no browser compatibility concerns

## Architecture & Technology Stack

This project uses **Electron Forge with React** specifically for desktop application development:

### Core Framework
- **Electron 36.1.0** with React 18.2.0 + TypeScript frontend
- **Electron Forge** for development and packaging (matches CCP's choice)
- **Webpack** for module bundling (NOT Vite - discovered CCP uses webpack)
- **Built-in React state** (simplified, no Redux initially)

### Current Project Structure
```
eva-desktop-forge/eva-desktop-forge/
├── src/
│   ├── index.ts         # Main Electron process
│   ├── renderer.ts      # Renderer entry point
│   ├── preload.ts       # Preload script for IPC
│   ├── main/            # Main process modules (auth, ESI, storage)
│   ├── renderer/        # React frontend
│   │   ├── App.tsx      # Main App component (EVE launcher recreation)
│   │   └── App.css      # Complete EVE launcher styling
│   └── shared/          # Shared utilities and constants
├── webpack.*.config.ts  # Webpack configurations
├── forge.config.ts      # Electron Forge configuration
└── package.json         # Dependencies and scripts
```

### Key Integrations
- **EVE Online ESI API** - OAuth2 authentication with URL scheme (`eva://` protocol)
- **electron-store** for secure character data storage
- **Native notifications** for both Windows and macOS
- **URL scheme handling** for EVE SSO authentication callbacks

## Design System - EVE Online Launcher Recreation

The application is a **pixel-perfect recreation** of the EVE Online launcher with:

### Visual Design
- **Space-themed Background**: Radial gradients matching EVE's nebula effects
- **EVE Color Palette**: 
  - Orange/amber (#ff7722) for primary branding and highlights
  - Blue (#00d4ff) for secondary accents and active states
  - Deep space blacks and grays for backgrounds
- **Layout Structure**: Three-column layout exactly matching EVE launcher
  - Left sidebar: Promotional content and news items
  - Central area: Character display and main content
  - Right panel: Server status and launch controls

### Layout Components
- **Top Navigation**: EVE-style tabs (Home, EVE Store, Account, Support)
- **Character Display**: Large character portraits with proper EVE styling
- **Promotional Content**: "20% OFF PLEX" banners and news items
- **Launch Controls**: "PLAY NOW" style buttons with EVE branding
- **Status Indicators**: Animated connection status with proper styling
- **Bottom Status Bar**: Version info, server status, time display

### CSS Implementation
- **Glassmorphism effects** with backdrop filters
- **Proper EVE animations** (pulse effects, hover states)
- **Responsive design** that maintains EVE launcher proportions
- **Platform-specific styling** (macOS traffic light spacing)

## **TOKEN-EFFICIENT DEVELOPMENT WORKFLOWS**

### **Core Principles for Claude Code Usage**

1. **ALWAYS USE PLAN MODE** for architectural decisions and task planning
   - Use `exit_plan_mode` tool for comprehensive feature planning
   - Present complete plans before executing any changes
   - Factor in recommendations.md priorities and timelines

2. **BATCH RELATED OPERATIONS** to minimize token usage
   - Use `MultiEdit` for multiple file changes in single operations
   - Group related testing and verification into single sessions
   - Use concurrent tool calls for independent operations (reading multiple files)

3. **IMPLEMENT CHECKPOINT SYSTEM**
   - Use `/clear` command after completing major task groups
   - Update todos with `TodoWrite` between milestones
   - Check `TodoRead` to identify next priority tasks

4. **PROJECT-BASED ORGANIZATION**
   - Focus on one feature per development session
   - Use step-by-step prompts for iterative development
   - Reference external documentation efficiently (eveship.fit, EVE data)

5. **MINIMIZE CONTEXT SWITCHING**
   - Complete related tasks in single sessions
   - Avoid jumping between unrelated features
   - Group database operations, UI changes, and testing together

### **Feature Development Workflow**

```
FEATURE PLANNING:
1. Enter plan mode for architectural analysis
2. Reference recommendations.md for priorities
3. Create comprehensive task breakdown
4. Present plan for user approval

FEATURE IMPLEMENTATION:
1. Read existing related files concurrently
2. Use MultiEdit for batch file changes
3. Test and verify functionality
4. Update todos and documentation
5. Use /clear to reset context

FEATURE COMPLETION:
1. Verify success criteria met
2. Update project status
3. Plan next feature iteration
```

### **Task Grouping Strategy**

**TASK GROUP 1: Ship Fitting UI Implementation**
- Clone/analyze EVEShipFit patterns
- Implement ship selection and module drag-and-drop
- Add fitting validation (CPU/power/slots)
- Test with demo data

**TASK GROUP 2: SDE Data Foundation**  
- Trigger comprehensive SDE import
- Implement dogma attributes loading
- Add performance optimizations
- Verify complete dataset

**TASK GROUP 3: EVE Dogma DPS Calculator**
- Rebuild DPS calculator with proper formulas
- Add charge damage calculations
- Implement ship bonuses and skill effects
- Support all weapon types

### **Authentication System ✅ IMPLEMENTED**
- **URL Scheme OAuth2**: Uses `eva://auth/callback` protocol
- **External Browser Flow**: Launches EVE SSO in system browser
- **Secure Token Storage**: Uses electron-store with encryption
- **Pre-configured Credentials**: Client ID provided (no dev account needed)
- **Character Management**: Displays character info in EVE launcher style

### **ESI API Integration ✅ IMPLEMENTED**
- Proper OAuth2 flow with secure token storage
- URL scheme callback handling (`eva://` protocol)
- Character skills and skill queue API endpoints
- Comprehensive error handling and retry logic
- Token refresh management

### **Security Requirements ✅ IMPLEMENTED**
- Electron's secure defaults with proper IPC communication
- Encrypted token storage for ESI credentials
- URL scheme protocol registration for secure callbacks
- No sensitive information in code (uses provided credentials)

### **Cross-Platform Support**
- Target Windows and macOS only
- Electron Forge for consistent packaging and development
- Platform-specific window controls and styling
- Universal binary support for macOS

## Build Commands

```bash
npm start                   # Start development server
npm run package             # Package application for current platform
npm run make                # Create distributables
npm run publish             # Publish to configured targets
```

## **CURRENT IMPLEMENTATION STATUS**

### Phase 1: Foundation ✅ COMPLETED
- Electron Forge + Webpack setup matching EVE launcher tech stack
- Project structure and configuration
- TypeScript configuration and build pipeline

### Phase 2: Authentication ✅ COMPLETED
- URL scheme-based OAuth2 authentication
- EVE SSO integration with external browser flow
- Secure token storage and character data management
- IPC communication for auth operations

### Phase 3: UI Design ✅ COMPLETED
- Complete EVE Online launcher visual recreation
- Three-column layout with proper proportions
- Space-themed background and EVE color palette
- Character display with proper styling
- Promotional content and news sections
- Launch controls and status indicators

### Phase 4: Skills Integration 🚧 IN PROGRESS
- Connect authenticated users to ESI skills API
- Display character skills in EVE-themed interface
- Implement skill queue visualization
- Add skills navigation and filtering

### Phase 5: Ship Fitting System 🚧 IN PROGRESS
- Functional ship selection and module fitting interface
- Complete SDE data integration (500+ ships, 2000+ modules)
- Accurate DPS calculations using EVE Dogma mechanics
- Fitting validation and optimization tools

## **CRITICAL DEVELOPMENT PRIORITIES**

Based on recommendations.md Phase 1 (Critical Fixes):

1. **Fix SDE import to load full dataset** (4 hours) - Critical for ship/module availability
2. **Add charge damage calculation** (2 hours) - Essential for accurate DPS  
3. **Fix stacking penalty formula** (30 minutes) - Immediate impact on DPS accuracy
4. **Fix missing dogma attributes and effects** (2 hours) - Required for bonus calculations
5. **Fix volley vs DPS terminology confusion** (1 hour) - User clarity

## Design Consistency Requirements

When implementing new features:

1. **Maintain EVE Launcher Aesthetic**: All new UI elements must match the established EVE launcher visual design
2. **Use EVE Color Palette**: Stick to orange (#ff7722) and blue (#00d4ff) accent colors
3. **Follow Layout Structure**: Maintain the three-column layout and component hierarchy
4. **Preserve Visual Effects**: Use glassmorphism, gradients, and animations consistently
5. **Match Typography**: Use EVE-style uppercase text and letter spacing

## Authentication Flow

1. User clicks "LOG IN TO EVE ONLINE" button
2. Application opens EVE SSO URL in system browser
3. User authenticates and authorizes ESI scopes
4. EVE SSO redirects to `eva://auth/callback` URL scheme
5. Electron app receives callback and exchanges code for tokens
6. Tokens stored securely, character info fetched
7. UI updates to show connected character with EVE styling

## Testing the Application

When testing EVA:
1. **Visual Verification**: Compare with actual EVE launcher screenshots
2. **Authentication Flow**: Test login/logout with EVE SSO
3. **Character Display**: Verify character info displays correctly
4. **Responsive Behavior**: Test window resizing and layout adaptation
5. **Platform Features**: Test on both Windows and macOS

The application should feel and look exactly like the EVE Online launcher while providing character skill management functionality.

## **WORKFLOW REMINDERS**

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- Always use plan mode when creating tasks or planning future steps
- Ensure you factor in the recommendations.md file priorities
- Use the least amount of token calls possible by grouping related operations
- Run /clear after every completed task group to reset context efficiently