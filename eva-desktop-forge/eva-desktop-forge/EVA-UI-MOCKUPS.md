# EVA - Futuristic Holographic UI Style Guide with SVG Mockups

## Overview

This document outlines the complete design system for EVA's futuristic, transparent, holographic interface with detailed SVG mockups for implementation reference.

## Color Palette

### Primary Colors
- **Cyan Blue**: `#00D4FF` - Primary accent, borders, highlights
- **Deep Cyan**: `#0099CC` - Secondary accents, buttons
- **Electric Blue**: `#0066FF` - Active states, progress indicators

### Supporting Colors
- **Teal**: `#00CCAA` - Success states, positive indicators
- **Orange**: `#FF7722` - Warning states, secondary accents
- **White**: `#FFFFFF` - Primary text, important content
- **Light Gray**: `#CCCCCC` - Secondary text, labels

### Background Colors
- **Deep Space**: `#0A0A1A` - Primary background
- **Dark Blue**: `#1A1A2E` - Secondary background
- **Transparent Black**: `rgba(0, 0, 0, 0.3)` - Panel backgrounds
- **Transparent Cyan**: `rgba(0, 212, 255, 0.1)` - Hover states

## SVG Mockups

### 1. Main Dashboard

<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#0A0A1A"/>
  <defs>
    <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,212,255,0.1);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(0,0,0,0.2);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(159,122,234,0.1);stop-opacity:1" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Header -->
  <rect x="20" y="20" width="760" height="60" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="55" font-family="Orbitron, monospace" font-size="24" font-weight="700" fill="#00D4FF" text-anchor="middle">EVA DASHBOARD</text>
  
  <!-- Left Panel - Character Info -->
  <rect x="20" y="100" width="240" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="140" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">CHARACTER INFO</text>
  
  <!-- Character Portrait -->
  <rect x="40" y="150" width="200" height="120" rx="8" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="140" y="215" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF" text-anchor="middle">3D Portrait</text>
  
  <!-- Character Details -->
  <text x="40" y="290" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Name: Capsuleer</text>
  <text x="40" y="310" font-family="Orbitron, monospace" font-size="12" fill="#CCCCCC">Corp: Test Corp</text>
  <text x="40" y="330" font-family="Orbitron, monospace" font-size="12" fill="#CCCCCC">Sec Status: 5.0</text>
  
  <!-- Quick Actions -->
  <rect x="40" y="350" width="200" height="30" rx="6" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="140" y="370" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">[🚀] Ship Fitting</text>
  
  <rect x="40" y="390" width="200" height="30" rx="6" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="140" y="410" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">[📊] Skills</text>
  
  <!-- Center Panel - Current Ship -->
  <rect x="280" y="100" width="240" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">CURRENT SHIP</text>
  
  <!-- Ship Model Area -->
  <rect x="300" y="150" width="200" height="200" rx="8" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="400" y="255" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF" text-anchor="middle">Vexor Navy Issue</text>
  <text x="400" y="275" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">3D Holographic Model</text>
  
  <!-- Ship Details -->
  <text x="300" y="380" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Ship: Vexor Navy Issue</text>
  <text x="300" y="400" font-family="Orbitron, monospace" font-size="12" fill="#CCCCCC">Location: Jita IV-4</text>
  <text x="300" y="420" font-family="Orbitron, monospace" font-size="12" fill="#CCCCCC">Security: 1.0</text>
  <text x="300" y="440" font-family="Orbitron, monospace" font-size="12" fill="#00CCAA">Status: Docked</text>
  
  <!-- Right Panel - Quick Stats -->
  <rect x="540" y="100" width="240" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="660" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">QUICK STATS</text>
  
  <!-- Stats -->
  <text x="560" y="170" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF">ISK: 1.2B</text>
  <text x="560" y="190" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF">SP: 15.2M</text>
  <text x="560" y="210" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF">Skills: 127</text>
  <text x="560" y="230" font-family="Orbitron, monospace" font-size="14" fill="#00CCAA">Queued: 7</text>
  
  <!-- Training Queue -->
  <rect x="560" y="260" width="200" height="100" rx="8" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="660" y="280" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">Currently Training</text>
  <text x="660" y="300" font-family="Orbitron, monospace" font-size="14" fill="#FFFFFF" text-anchor="middle">Gunnery V</text>
  
  <!-- Progress Bar -->
  <rect x="580" y="320" width="160" height="8" rx="4" fill="rgba(0,0,0,0.6)" stroke="#00D4FF" stroke-width="1"/>
  <rect x="580" y="320" width="128" height="8" rx="4" fill="#00D4FF"/>
  
  <text x="660" y="345" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC" text-anchor="middle">Completes: 2h 35m</text>
</svg>

### 2. Ship Browser

<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#0A0A1A"/>
  
  <!-- Header -->
  <rect x="20" y="20" width="760" height="60" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="55" font-family="Orbitron, monospace" font-size="24" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP BROWSER</text>
  
  <!-- Left Panel - Filters -->
  <rect x="20" y="100" width="200" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="120" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">FILTERS</text>
  
  <!-- Faction Filter -->
  <text x="40" y="160" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Faction:</text>
  <rect x="40" y="170" width="160" height="25" rx="4" fill="rgba(0,0,0,0.4)" stroke="#00D4FF" stroke-width="1"/>
  <text x="50" y="187" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">All Factions ▼</text>
  
  <!-- Ship Class Filter -->
  <text x="40" y="220" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Ship Class:</text>
  <text x="50" y="240" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Frigates</text>
  <text x="50" y="255" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Destroyers</text>
  <text x="50" y="270" font-family="Orbitron, monospace" font-size="11" fill="#00D4FF">▼ Cruisers (58)</text>
  <text x="60" y="285" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Vexor</text>
  <text x="60" y="300" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Thorax</text>
  <text x="60" y="315" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Omen</text>
  
  <!-- Search -->
  <text x="40" y="350" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Search:</text>
  <rect x="40" y="360" width="160" height="25" rx="4" fill="rgba(0,0,0,0.4)" stroke="#00D4FF" stroke-width="1"/>
  <text x="50" y="377" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">vexor</text>
  
  <!-- Center Panel - Ship Grid -->
  <rect x="240" y="100" width="360" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="420" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP GRID</text>
  
  <!-- Ship Cards Row 1 -->
  <rect x="260" y="150" width="80" height="80" rx="6" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="300" y="175" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">[🚀]</text>
  <text x="300" y="190" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">Vexor</text>
  <text x="300" y="205" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC" text-anchor="middle">Navy Issue</text>
  
  <rect x="350" y="150" width="80" height="80" rx="6" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="390" y="175" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">[🚀]</text>
  <text x="390" y="190" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">Drake</text>
  
  <rect x="440" y="150" width="80" height="80" rx="6" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="480" y="175" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">[🚀]</text>
  <text x="480" y="190" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">Myrmidon</text>
  
  <rect x="530" y="150" width="80" height="80" rx="6" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="570" y="175" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">[🚀]</text>
  <text x="570" y="190" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">Dominix</text>
  
  <!-- Ship Details Panel at bottom -->
  <rect x="260" y="450" width="320" height="120" rx="8" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="420" y="470" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">SHIP DETAILS PREVIEW</text>
  <text x="270" y="490" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Selected: Vexor Navy Issue</text>
  <text x="270" y="505" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Class: Cruiser | Faction: Gallente</text>
  <text x="270" y="520" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Slots: 5H/4M/5L | CPU: 400tf | PG: 1100MW</text>
  
  <!-- Right Panel - Ship Stats -->
  <rect x="620" y="100" width="160" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="700" y="130" font-family="Orbitron, monospace" font-size="14" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP STATS</text>
  
  <!-- Stats -->
  <text x="640" y="160" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Power Grid:</text>
  <text x="640" y="175" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">1100 MW</text>
  
  <text x="640" y="200" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">CPU:</text>
  <text x="640" y="215" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">400 tf</text>
  
  <text x="640" y="240" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Calibration:</text>
  <text x="640" y="255" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">400</text>
  
  <text x="640" y="280" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">High Slots:</text>
  <text x="640" y="295" font-family="Orbitron, monospace" font-size="10" fill="#00CCAA">5</text>
  
  <text x="640" y="320" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Med Slots:</text>
  <text x="640" y="335" font-family="Orbitron, monospace" font-size="10" fill="#00CCAA">4</text>
  
  <text x="640" y="360" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Low Slots:</text>
  <text x="640" y="375" font-family="Orbitron, monospace" font-size="10" fill="#00CCAA">5</text>
</svg>

### 3. Module Browser

<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#0A0A1A"/>
  
  <!-- Header -->
  <rect x="20" y="20" width="760" height="60" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="55" font-family="Orbitron, monospace" font-size="24" font-weight="700" fill="#00D4FF" text-anchor="middle">MODULE BROWSER</text>
  
  <!-- Left Panel - Categories -->
  <rect x="20" y="100" width="200" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="120" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">CATEGORIES</text>
  
  <!-- Slot Type -->
  <text x="40" y="160" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Slot Type:</text>
  <text x="50" y="180" font-family="Orbitron, monospace" font-size="11" fill="#00D4FF">● High Power</text>
  <text x="50" y="195" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">○ Medium Power</text>
  <text x="50" y="210" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">○ Low Power</text>
  <text x="50" y="225" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">○ Rigs</text>
  
  <!-- Categories -->
  <text x="40" y="255" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Categories:</text>
  <text x="50" y="275" font-family="Orbitron, monospace" font-size="11" fill="#00D4FF">▼ Missile Launchers</text>
  <text x="60" y="290" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Heavy Missile</text>
  <text x="60" y="305" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Light Missile</text>
  <text x="60" y="320" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">• Rapid Light</text>
  <text x="50" y="340" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Turrets</text>
  <text x="50" y="355" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Drones</text>
  
  <!-- Meta Level -->
  <text x="40" y="385" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Meta Level:</text>
  <text x="50" y="405" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">☐ Meta 1-4</text>
  <text x="50" y="420" font-family="Orbitron, monospace" font-size="11" fill="#00D4FF">☑ Tech II</text>
  <text x="50" y="435" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">☐ Deadspace</text>
  <text x="50" y="450" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">☐ Officer</text>
  
  <!-- Center Panel - Module List -->
  <rect x="240" y="100" width="360" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="420" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">MODULE LIST</text>
  
  <!-- Module List Header -->
  <rect x="260" y="150" width="320" height="30" rx="6" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="420" y="170" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">Heavy Missile Launchers</text>
  
  <!-- Module Items -->
  <rect x="260" y="190" width="320" height="30" rx="4" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="270" y="210" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">[💫] Heavy Missile Launcher II</text>
  <text x="540" y="210" font-family="Orbitron, monospace" font-size="9" fill="#00D4FF">Meta 5</text>
  
  <rect x="260" y="230" width="320" height="30" rx="4" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="270" y="250" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">[💫] Heavy Assault Missile Launcher II</text>
  <text x="540" y="250" font-family="Orbitron, monospace" font-size="9" fill="#00D4FF">Meta 5</text>
  
  <rect x="260" y="270" width="320" height="30" rx="4" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="270" y="290" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">[⭐] 'Arbalest' Heavy Missile Launcher</text>
  <text x="540" y="290" font-family="Orbitron, monospace" font-size="9" fill="#FF7722">Meta 4</text>
  
  <rect x="260" y="310" width="320" height="30" rx="4" fill="rgba(0,212,255,0.1)" stroke="#00CCAA" stroke-width="1"/>
  <text x="270" y="330" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">[⚪] Heavy Missile Launcher I</text>
  <text x="540" y="330" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">Meta 1</text>
  
  <!-- Right Panel - Module Stats -->
  <rect x="620" y="100" width="160" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="700" y="130" font-family="Orbitron, monospace" font-size="14" font-weight="700" fill="#00D4FF" text-anchor="middle">MODULE STATS</text>
  
  <!-- Selected Module -->
  <rect x="640" y="150" width="120" height="30" rx="6" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="700" y="170" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF" text-anchor="middle">Heavy Missile Launcher II</text>
  
  <!-- Stats -->
  <text x="640" y="200" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">Damage Mult:</text>
  <text x="640" y="215" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">1.0x</text>
  
  <text x="640" y="235" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">Rate of Fire:</text>
  <text x="640" y="250" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">8.0s</text>
  
  <text x="640" y="270" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">CPU Usage:</text>
  <text x="640" y="285" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">35 tf</text>
  
  <text x="640" y="305" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">Powergrid:</text>
  <text x="640" y="320" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">15 MW</text>
  
  <text x="640" y="340" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">Charges:</text>
  <text x="640" y="355" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">Heavy Missiles</text>
  
  <!-- Skill Requirements -->
  <text x="640" y="385" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">Skill Req:</text>
  <text x="640" y="400" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">• Heavy Missiles V</text>
  <text x="640" y="415" font-family="Orbitron, monospace" font-size="9" fill="#CCCCCC">• Weapon Upgrades V</text>
  
  <!-- Actions -->
  <rect x="640" y="450" width="120" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="700" y="467" font-family="Orbitron, monospace" font-size="9" fill="#00D4FF" text-anchor="middle">[⚡ Fit to Ship]</text>
</svg>

### 4. Skill Planner

<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#0A0A1A"/>
  
  <!-- Header -->
  <rect x="20" y="20" width="760" height="60" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="55" font-family="Orbitron, monospace" font-size="24" font-weight="700" fill="#00D4FF" text-anchor="middle">SKILL PLANNER</text>
  
  <!-- Left Panel - Skill Categories -->
  <rect x="20" y="100" width="240" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="140" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SKILL OVERVIEW</text>
  
  <!-- Total SP Circle -->
  <circle cx="140" cy="180" r="30" fill="none" stroke="rgba(0,212,255,0.3)" stroke-width="4"/>
  <circle cx="140" cy="180" r="30" fill="none" stroke="#00D4FF" stroke-width="4" stroke-dasharray="150 50" stroke-linecap="round"/>
  <text x="140" y="175" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">15.2M</text>
  <text x="140" y="190" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">75%</text>
  
  <!-- Categories -->
  <text x="40" y="240" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Categories:</text>
  <text x="50" y="260" font-family="Orbitron, monospace" font-size="11" fill="#00D4FF">▼ Gunnery (12)</text>
  <text x="60" y="275" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">•⚡Gunnery V</text>
  <text x="60" y="290" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">•⚡Large Hybrid IV</text>
  <text x="60" y="305" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF">•⚡Medium Hybrid V</text>
  <text x="50" y="325" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Missiles (8)</text>
  <text x="50" y="340" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Spaceship (15)</text>
  <text x="50" y="355" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">▶ Engineering (9)</text>
  
  <!-- Training Queue -->
  <text x="40" y="390" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Skill Queue:</text>
  <rect x="40" y="400" width="200" height="80" rx="6" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="50" y="420" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF">🔄 Training</text>
  <text x="50" y="435" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Large Hybrid V</text>
  <text x="50" y="450" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">3d 12h remaining</text>
  
  <!-- Progress Bar -->
  <rect x="50" y="460" width="180" height="6" rx="3" fill="rgba(0,0,0,0.6)" stroke="#00D4FF" stroke-width="1"/>
  <rect x="50" y="460" width="108" height="6" rx="3" fill="#00D4FF"/>
  
  <!-- Center Panel - Skill Tree -->
  <rect x="280" y="100" width="320" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="440" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SKILL TREE</text>
  
  <!-- Skill Tree Nodes -->
  <!-- Core Gunnery -->
  <circle cx="350" cy="200" r="15" fill="#00D4FF" stroke="#FFFFFF" stroke-width="2"/>
  <text x="350" y="205" font-family="Orbitron, monospace" font-size="10" fill="#FFFFFF" text-anchor="middle">Gun</text>
  <text x="350" y="225" font-family="Orbitron, monospace" font-size="8" fill="#00D4FF" text-anchor="middle">V</text>
  
  <!-- Large Hybrid -->
  <circle cx="450" cy="170" r="12" fill="rgba(0,212,255,0.5)" stroke="#00D4FF" stroke-width="2"/>
  <text x="450" y="175" font-family="Orbitron, monospace" font-size="8" fill="#FFFFFF" text-anchor="middle">LH</text>
  <text x="450" y="190" font-family="Orbitron, monospace" font-size="8" fill="#00D4FF" text-anchor="middle">IV</text>
  
  <!-- Medium Hybrid -->
  <circle cx="450" cy="230" r="12" fill="#00D4FF" stroke="#FFFFFF" stroke-width="2"/>
  <text x="450" y="235" font-family="Orbitron, monospace" font-size="8" fill="#FFFFFF" text-anchor="middle">MH</text>
  <text x="450" y="250" font-family="Orbitron, monospace" font-size="8" fill="#00D4FF" text-anchor="middle">V</text>
  
  <!-- Specialization Skills -->
  <circle cx="550" cy="200" r="10" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="2"/>
  <text x="550" y="205" font-family="Orbitron, monospace" font-size="7" fill="#CCCCCC" text-anchor="middle">Sp</text>
  <text x="550" y="220" font-family="Orbitron, monospace" font-size="7" fill="#CCCCCC" text-anchor="middle">0</text>
  
  <!-- Connection Lines -->
  <line x1="365" y1="200" x2="435" y2="170" stroke="#00D4FF" stroke-width="2" opacity="0.7"/>
  <line x1="365" y1="200" x2="435" y2="230" stroke="#00D4FF" stroke-width="2" opacity="0.7"/>
  <line x1="462" y1="200" x2="540" y2="200" stroke="rgba(0,212,255,0.3)" stroke-width="2" stroke-dasharray="5,5"/>
  
  <!-- Right Panel - Projections -->
  <rect x="620" y="100" width="160" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="700" y="130" font-family="Orbitron, monospace" font-size="14" font-weight="700" fill="#00D4FF" text-anchor="middle">PROJECTIONS</text>
  
  <!-- Training Time -->
  <text x="640" y="160" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Total Plan:</text>
  <text x="640" y="175" font-family="Orbitron, monospace" font-size="12" fill="#00CCAA">11d 14h</text>
  
  <!-- Unlocked Ships -->
  <text x="640" y="205" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Ships Unlocked:</text>
  <text x="640" y="220" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Megathron</text>
  <text x="640" y="235" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Hyperion</text>
  <text x="640" y="250" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Vindicator</text>
  
  <!-- Fitting Improvements -->
  <text x="640" y="280" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">DPS Increase:</text>
  <text x="640" y="295" font-family="Orbitron, monospace" font-size="12" fill="#00CCAA">+15%</text>
  
  <text x="640" y="320" font-family="Orbitron, monospace" font-size="11" fill="#FFFFFF">Range Bonus:</text>
  <text x="640" y="335" font-family="Orbitron, monospace" font-size="12" fill="#00CCAA">+25%</text>
  
  <!-- Actions -->
  <rect x="640" y="370" width="120" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="700" y="387" font-family="Orbitron, monospace" font-size="9" fill="#00D4FF" text-anchor="middle">[🎓] Plan Training</text>
  
  <rect x="640" y="405" width="120" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="700" y="422" font-family="Orbitron, monospace" font-size="9" fill="#00D4FF" text-anchor="middle">[⏰] Add to Queue</text>
</svg>

### 5. Ship Fitting Interface

<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="600" fill="#0A0A1A"/>
  
  <!-- Header -->
  <rect x="20" y="20" width="760" height="60" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="55" font-family="Orbitron, monospace" font-size="24" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP FITTING</text>
  
  <!-- Left Panel - Ship Selection -->
  <rect x="20" y="100" width="200" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="120" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP SELECTION</text>
  
  <!-- Current Ship -->
  <rect x="40" y="150" width="160" height="80" rx="6" fill="rgba(0,0,0,0.4)" stroke="#00CCAA" stroke-width="1"/>
  <text x="120" y="175" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF" text-anchor="middle">Vexor Navy Issue</text>
  <text x="120" y="190" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF" text-anchor="middle">Gallente Cruiser</text>
  <text x="120" y="205" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC" text-anchor="middle">5H / 4M / 5L</text>
  
  <!-- Faction Filter -->
  <text x="40" y="260" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Faction:</text>
  <rect x="40" y="270" width="160" height="25" rx="4" fill="rgba(0,0,0,0.4)" stroke="#00D4FF" stroke-width="1"/>
  <text x="50" y="287" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">Gallente ▼</text>
  
  <!-- Ship List -->
  <text x="40" y="320" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Available Ships:</text>
  <text x="50" y="340" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Vexor</text>
  <text x="50" y="355" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF">• Vexor Navy Issue</text>
  <text x="50" y="370" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Ishtar</text>
  <text x="50" y="385" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">• Myrmidon</text>
  
  <!-- Center Panel - Fitting Layout -->
  <rect x="220" y="100" width="360" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="400" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP FITTING</text>
  
  <!-- Ship Silhouette -->
  <ellipse cx="400" cy="250" rx="60" ry="40" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="2"/>
  <text x="400" y="255" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF" text-anchor="middle">Vexor</text>
  <text x="400" y="270" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF" text-anchor="middle">Navy Issue</text>
  
  <!-- High Slots (Top Arc) -->
  <text x="400" y="170" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">High Slots</text>
  <circle cx="350" cy="190" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="350" y="195" font-family="Orbitron, monospace" font-size="8" fill="#FFFFFF" text-anchor="middle">HML</text>
  <circle cx="380" cy="185" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="380" y="190" font-family="Orbitron, monospace" font-size="8" fill="#FFFFFF" text-anchor="middle">HML</text>
  <circle cx="420" cy="185" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="420" y="190" font-family="Orbitron, monospace" font-size="8" fill="#FFFFFF" text-anchor="middle">HML</text>
  <circle cx="450" cy="190" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  <circle cx="480" cy="200" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  
  <!-- Medium Slots (Right Side) -->
  <text x="520" y="220" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF">Medium</text>
  <circle cx="540" cy="240" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="540" y="245" font-family="Orbitron, monospace" font-size="7" fill="#FFFFFF" text-anchor="middle">LSE</text>
  <circle cx="540" cy="270" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="540" y="275" font-family="Orbitron, monospace" font-size="7" fill="#FFFFFF" text-anchor="middle">AB</text>
  <circle cx="540" y="300" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  <circle cx="540" y="330" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  
  <!-- Low Slots (Bottom Arc) -->
  <text x="400" y="350" font-family="Orbitron, monospace" font-size="12" fill="#00D4FF" text-anchor="middle">Low Slots</text>
  <circle cx="320" cy="370" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="320" y="375" font-family="Orbitron, monospace" font-size="7" fill="#FFFFFF" text-anchor="middle">DCU</text>
  <circle cx="360" cy="380" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="360" y="385" font-family="Orbitron, monospace" font-size="7" fill="#FFFFFF" text-anchor="middle">BCS</text>
  <circle cx="400" cy="385" r="12" fill="rgba(0,212,255,0.3)" stroke="#00D4FF" stroke-width="2"/>
  <text x="400" y="390" font-family="Orbitron, monospace" font-size="7" fill="#FFFFFF" text-anchor="middle">BCS</text>
  <circle cx="440" cy="380" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  <circle cx="480" cy="370" r="12" fill="rgba(0,0,0,0.4)" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="3,3"/>
  
  <!-- Right Panel - Ship Stats -->
  <rect x="600" y="100" width="180" height="480" rx="12" fill="url(#panelGradient)" stroke="#00D4FF" stroke-width="2" filter="url(#glow)"/>
  <text x="690" y="130" font-family="Orbitron, monospace" font-size="16" font-weight="700" fill="#00D4FF" text-anchor="middle">SHIP STATS</text>
  
  <!-- Power Stats -->
  <text x="620" y="160" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Power:</text>
  <text x="620" y="175" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">447.5 / 1500 MW</text>
  <rect x="620" y="185" width="140" height="8" rx="4" fill="rgba(0,0,0,0.6)" stroke="#00D4FF" stroke-width="1"/>
  <rect x="620" y="185" width="42" height="8" rx="4" fill="#00CCAA"/>
  
  <!-- CPU Stats -->
  <text x="620" y="210" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">CPU:</text>
  <text x="620" y="225" font-family="Orbitron, monospace" font-size="11" fill="#CCCCCC">225.8 / 575.0 tf</text>
  <rect x="620" y="235" width="140" height="8" rx="4" fill="rgba(0,0,0,0.6)" stroke="#00D4FF" stroke-width="1"/>
  <rect x="620" y="235" width="55" height="8" rx="4" fill="#FF7722"/>
  
  <!-- DPS -->
  <text x="620" y="265" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">DPS:</text>
  <text x="620" y="280" font-family="Orbitron, monospace" font-size="14" fill="#00CCAA">625.5</text>
  
  <!-- Defenses -->
  <text x="620" y="310" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Defenses:</text>
  <text x="620" y="325" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Shield: 4,500</text>
  <text x="620" y="340" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Armor: 2,100</text>
  <text x="620" y="355" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Hull: 1,800</text>
  
  <!-- Navigation -->
  <text x="620" y="385" font-family="Orbitron, monospace" font-size="12" fill="#FFFFFF">Navigation:</text>
  <text x="620" y="400" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Speed: 185 m/s</text>
  <text x="620" y="415" font-family="Orbitron, monospace" font-size="10" fill="#CCCCCC">Agility: 0.5s</text>
  
  <!-- Actions -->
  <rect x="620" y="450" width="140" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="690" y="467" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF" text-anchor="middle">[💾] Save Fitting</text>
  
  <rect x="620" y="485" width="140" height="25" rx="4" fill="rgba(0,212,255,0.2)" stroke="#00D4FF" stroke-width="1"/>
  <text x="690" y="502" font-family="Orbitron, monospace" font-size="10" fill="#00D4FF" text-anchor="middle">[📋] Copy to EFT</text>
</svg>

## CSS Implementation Guide

### Core Glass Morphism Panel

```css
.panel {
  background: linear-gradient(135deg, 
    rgba(0, 212, 255, 0.1) 0%, 
    rgba(0, 0, 0, 0.2) 50%, 
    rgba(159, 122, 234, 0.1) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border: 2px solid #00D4FF;
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 212, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: 'Orbitron', 'Exo 2', 'Rajdhani', 'Space Mono', monospace;
}

.panel-header {
  color: #00D4FF;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 0 8px #00D4FF;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
}
```

### Interactive States

```css
.panel:hover {
  background: linear-gradient(135deg, 
    rgba(0, 212, 255, 0.2) 0%, 
    rgba(0, 0, 0, 0.3) 50%, 
    rgba(159, 122, 234, 0.15) 100%);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 
    0 12px 40px rgba(0, 212, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.glow-animation {
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
  }
}
```

### Typography System

```css
.text-hero { font-size: 32px; font-weight: 900; }
.text-h1 { font-size: 24px; font-weight: 700; }
.text-h2 { font-size: 20px; font-weight: 500; }
.text-h3 { font-size: 16px; font-weight: 500; }
.text-body { font-size: 14px; font-weight: 400; }
.text-small { font-size: 12px; font-weight: 300; }

.text-primary { color: #FFFFFF; }
.text-accent { color: #00D4FF; }
.text-secondary { color: #CCCCCC; }
.text-success { color: #00CCAA; }
.text-warning { color: #FF7722; }
```

## Implementation Notes

1. **Use SVG mockups as pixel-perfect reference** for layout, spacing, and proportions
2. **Apply glassmorphism effects consistently** across all panels and components  
3. **Maintain consistent color palette** throughout the interface
4. **Implement smooth animations** for hover states and transitions
5. **Ensure responsive design** adapts to different screen sizes
6. **Test backdrop-filter support** and provide fallbacks for older browsers

This comprehensive guide provides both visual SVG references and technical CSS implementation details to create a cohesive, futuristic holographic interface for the EVA application.
