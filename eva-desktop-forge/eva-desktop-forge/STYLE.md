# EVA - Futuristic Holographic UI Style Guide

## Overview
This document outlines the complete design system for EVA's futuristic, transparent, holographic interface based on the reference design. The goal is to create a cohesive, animated, sci-fi interface that feels immersive and cutting-edge.

## Design Philosophy
- **Holographic Transparency**: All UI elements should appear to float in 3D space with glass-like transparency
- **Futuristic Minimalism**: Clean lines, geometric shapes, and purposeful negative space
- **Dynamic Animation**: Subtle animations that enhance the user experience without being distracting
- **Consistent Visual Language**: All components follow the same design principles and visual hierarchy

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

## Typography

### Font Stack
```css
font-family: 'Orbitron', 'Exo 2', 'Rajdhani', 'Space Mono', monospace;
```

### Font Weights
- **Light**: 300 - Secondary text, labels
- **Regular**: 400 - Body text
- **Medium**: 500 - Subheadings
- **Bold**: 700 - Headers, important text
- **Black**: 900 - Main titles

### Font Sizes
- **Hero**: 32px - Main page titles
- **H1**: 24px - Section headers
- **H2**: 20px - Subsection headers
- **H3**: 16px - Component titles
- **Body**: 14px - Regular text
- **Small**: 12px - Labels, metadata
- **Tiny**: 10px - Fine print

## Glass Morphism Effects

### Standard Glass Panel
```css
background: linear-gradient(135deg, 
  rgba(0, 212, 255, 0.1) 0%, 
  rgba(0, 0, 0, 0.2) 50%, 
  rgba(159, 122, 234, 0.1) 100%);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(0, 212, 255, 0.3);
border-radius: 12px;
box-shadow: 
  0 8px 32px rgba(0, 212, 255, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

### Interactive Glass Panel (Hover)
```css
background: linear-gradient(135deg, 
  rgba(0, 212, 255, 0.2) 0%, 
  rgba(0, 0, 0, 0.3) 50%, 
  rgba(159, 122, 234, 0.15) 100%);
border-color: rgba(0, 212, 255, 0.5);
box-shadow: 
  0 12px 40px rgba(0, 212, 255, 0.25),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
```

## Component Design Specifications

### 1. Main Container Layout
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EVA Logo                                               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚  SKILL ANALYSIS â”‚  â”‚         SHIP FITTING            â”‚ â”‚
â”‚ â”‚                 â”‚  â”‚                                 â”‚ â”‚
â”‚ â”‚  Circular       â”‚  â”‚   Holographic Ship Model       â”‚ â”‚
â”‚ â”‚  Progress       â”‚  â”‚                                 â”‚ â”‚
â”‚ â”‚  Indicators     â”‚  â”‚   Slot Configuration            â”‚ â”‚
â”‚ â”‚                 â”‚  â”‚                                 â”‚ â”‚
â”‚ â”‚  Skill Categoriesâ”‚  â”‚   Module Lists                  â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2. Skill Analysis Panel

#### Circular Progress Indicators
- **Design**: Large circular progress rings with animated fills
- **Animation**: Smooth arc progression with glow effects
- **Typography**: Large numbers in center, percentage below
- **Colors**: Cyan gradient fill with white text

#### Skill Categories List
- **Design**: Horizontal bars with progress indicators
- **Layout**: Category name on left, level/points on right
- **Animation**: Bars fill on load with staggered timing
- **Hover Effect**: Subtle glow and scale increase

### 3. Ship Fitting Panel

#### 3D Ship Model Area
- **Background**: Transparent panel with subtle grid pattern
- **Ship Model**: Wireframe or holographic representation
- **Rotation**: Slow, continuous rotation animation
- **Interaction**: Click and drag to rotate manually

#### Module Slots
- **High Slots**: Top arc arrangement
- **Medium Slots**: Right side vertical
- **Low Slots**: Bottom arc arrangement
- **Design**: Circular slots with module icons
- **States**: Empty (outlined), Filled (glowing), Active (pulsing)

#### Module Lists
- **Layout**: Categorized lists with search/filter
- **Items**: Icon + name + stats in cards
- **Interaction**: Drag and drop to slots
- **Animation**: Hover effects and smooth transitions

### 4. Navigation and Controls

#### Top Navigation
```
EVE [Logo]     [Search Bar]     [User Profile] [Settings] [Minimize] [Close]
```

#### Tab System
- **Design**: Holographic tab buttons
- **Active State**: Glowing border and background
- **Inactive State**: Semi-transparent with subtle border
- **Animation**: Smooth transitions between tabs

## Animation Specifications

### 1. Page Load Animations
```css
@keyframes materialIn {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### 2. Hover Animations
```css
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
  }
}
```

### 3. Progress Animations
```css
@keyframes progressFill {
  0% {
    stroke-dasharray: 0 628;
  }
  100% {
    stroke-dasharray: var(--progress) 628;
  }
}
```

### 4. Floating Animations
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

## Interactive States

### Button States
1. **Default**: Semi-transparent with cyan border
2. **Hover**: Increased opacity, glowing border
3. **Active**: Full opacity, strong glow, slight scale
4. **Disabled**: Reduced opacity, no interactions

### Form Elements
1. **Input Fields**: Glass morphism with cyan focus border
2. **Dropdowns**: Animated slide-down with blur background
3. **Checkboxes**: Custom holographic checkmarks
4. **Sliders**: Glowing track with animated handle

## Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (Primary design)
- **Tablet**: 768px - 1199px (Adapted layout)
- **Mobile**: < 768px (Stacked panels)

### Mobile Adaptations
- Single column layout
- Collapsible panels
- Touch-friendly controls
- Simplified animations

## Implementation Strategy

### Phase 1: Core Design System
1. Set up CSS custom properties for colors and spacing
2. Create base glassmorphism mixins and utilities
3. Implement typography system
4. Build animation library

### Phase 2: Component Library
1. Basic UI components (buttons, inputs, cards)
2. Navigation components
3. Data visualization components
4. Interactive components

### Phase 3: Layout Implementation
1. Main container structure
2. Skill analysis panel
3. Ship fitting panel
4. Responsive adaptations

### Phase 4: Animation Integration
1. Page transitions
2. Component animations
3. Micro-interactions
4. Performance optimization

## Mockup Concepts

### Main Dashboard Mockup
```
â•­â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•®
â”‚ â•­â”€ EVE â”€â•®                                    [Profile] [âš™] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â•­â”€ SKILL ANALYSIS â”€â•®  â•­â”€ SHIP FITTING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•®  â”‚
â”‚ â”‚                  â”‚  â”‚                                 â”‚  â”‚
â”‚ â”‚  â•­â”€ SP â”€â•®  â•­â”€ SF â•®  â”‚  â”‚        â•­â”€ Holographic â”€â•®       â”‚  â”‚
â”‚ â”‚  â”‚ 75% â”‚  â”‚3.4Mâ”‚  â”‚  â”‚        â”‚    Ship Model   â”‚       â”‚  â”‚
â”‚ â”‚  â•°â”€â”€â”€â”€â”€â•¯  â•°â”€â”€â”€â”€â•¯  â”‚  â”‚        â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯       â”‚  â”‚
â”‚ â”‚                  â”‚  â”‚                                 â”‚  â”‚
â”‚ â”‚ â–ˆâ–ˆâ–ˆâ–ˆ Spaceship   â”‚  â”‚ â—‹ â—‹ â—‹ â† High Slots             â”‚  â”‚
â”‚ â”‚ â–ˆâ–ˆâ–ˆ  Gunnery     â”‚  â”‚ â—‹ â—‹   â† Medium Slots           â”‚  â”‚
â”‚ â”‚ â–ˆâ–ˆ   Missiles    â”‚  â”‚ â—‹ â—‹ â—‹ â† Low Slots              â”‚  â”‚
â”‚ â”‚ â–ˆ    Drones      â”‚  â”‚                                 â”‚  â”‚
â”‚ â”‚ â–“    Engineering â”‚  â”‚ [Module Browser]                â”‚  â”‚
â”‚ â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯  â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯  â”‚
â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯
```

### Ship Fitting Page Layout
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚
â”‚ â•‘                                   EVA                                      â•‘ â”‚
â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚
â”‚ â”‚ â•‘ SKILL ANALYSIS  â•‘ â”‚ â”‚ â•‘      SHIP FITTING         â•‘ â”‚ â”‚ â•‘ SHIP STATS  â•‘ â”‚ â”‚
â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚                               â”‚ â”‚                 â”‚ â”‚
â”‚ â”‚ â”Œâ”€ SP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€ High Slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€ Power â”€â”€â”€â”€â”€â”€â” â”‚ â”‚
â”‚ â”‚ â”‚ â—â—â— 75%         â”‚ â”‚ â”‚ â”‚ [â–£] Heavy Missile  3X   â”‚ â”‚ â”‚ â”‚ 4475.1/1500  â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ 3,467,020       â”‚ â”‚ â”‚ â”‚ [â–£] Heavy Missile  3X   â”‚ â”‚ â”‚ â”‚              â”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ [â–£] Heavy Missile  3X   â”‚ â”‚ â”‚ â”‚ CPU          â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â”‚ [ ] Empty Slot          â”‚ â”‚ â”‚ â”‚ 225.8/575.0  â”‚ â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Categories â”€â”€â”€â”€â” â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚              â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Spaceship Cmd â”‚ â”‚ â”‚                               â”‚ â”‚ â”‚ DPS          â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Gunnery       â”‚ â”‚ â”‚ â”Œâ”€â”€â”€â”€ Medium Slots â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”‚ 625.5        â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Missiles      â”‚ â”‚ â”‚ â”‚ [â–£] Large Shield   1X   â”‚ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Drones        â”‚ â”‚ â”‚ â”‚ [â–£] 10Mn Microwar  1X   â”‚ â”‚ â”‚                 â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Engineering   â”‚ â”‚ â”‚ â”‚ [â–£] Adaptive Immu  1X   â”‚ â”‚ â”‚ â”Œâ”€ Defenses â”€â”€â” â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ [ ] Empty Slot          â”‚ â”‚ â”‚ â”‚ Shield: 4.5k â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ Armor:  2.1k â”‚ â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Skill Queue â”€â”€â”€â” â”‚ â”‚                               â”‚ â”‚ â”‚ Hull:   1.8k â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ Power III       â”‚ â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€ Low Slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â”‚ â”‚ Tetions         â”‚ â”‚ â”‚ â”‚ [â–£] Damage Control 1X   â”‚ â”‚ â”‚                 â”‚ â”‚
â”‚ â”‚ â”‚ 31,000          â”‚ â”‚ â”‚ â”‚ [â–£] Ballistic Ctrl 2X   â”‚ â”‚ â”‚ â”Œâ”€ Navigation â”€â” â”‚ â”‚
â”‚ â”‚ â”‚                 â”‚ â”‚ â”‚ â”‚ [â–£] Shield Power   2X   â”‚ â”‚ â”‚ â”‚ Speed: 185m/sâ”‚ â”‚ â”‚
â”‚ â”‚ â”‚                 â”‚ â”‚ â”‚ â”‚ [â–£] Shield Power   3X   â”‚ â”‚ â”‚ â”‚ Agility: 0.5sâ”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Ship Browser Layout
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚
â”‚ â•‘                              SHIP BROWSER                                  â•‘ â”‚
â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚
â”‚ â”‚ â•‘    FILTERS      â•‘ â”‚ â”‚ â•‘                SHIP GRID                          â•‘ â”‚ â”‚
â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Faction â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”     â”‚ â”‚
â”‚ â”‚ â”‚ [â–¼] All         â”‚ â”‚ â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚     â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ VNI â”‚ â”‚Drakeâ”‚ â”‚Myrm â”‚ â”‚Domi â”‚ â”‚Ravenâ”‚ â”‚Apoc â”‚     â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜     â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Ship Class â”€â”€â”€â”€â” â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Frigates      â”‚ â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”     â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Destroyers    â”‚ â”‚ â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚     â”‚ â”‚
â”‚ â”‚ â”‚ â–¼ Cruisers (58) â”‚ â”‚ â”‚ â”‚Vexorâ”‚ â”‚Moa  â”‚ â”‚Omen â”‚ â”‚Stab â”‚ â”‚Cara â”‚ â”‚Thorax     â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Vexor       â”‚ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜     â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Myrmidon    â”‚ â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Thorax      â”‚ â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”     â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Omen        â”‚ â”‚ â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚ â”‚[â–£]  â”‚     â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Battlecruiser â”‚ â”‚ â”‚ â”‚Hurriâ”‚ â”‚Feroxâ”‚ â”‚Harb â”‚ â”‚Prop â”‚ â”‚Cycloneâ”‚ â”‚Bru  â”‚     â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Battleships   â”‚ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”˜     â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ [____________]  â”‚ â”‚ â”‚ â”‚ â•‘          SHIP DETAILS PREVIEW               â•‘ â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ ðŸ”              â”‚ â”‚ â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ Selected: Vexor Navy Issue                    â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â”‚ Class: Cruiser | Faction: Gallente            â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â”‚ Slots: 5H/4M/5L | CPU: 400tf | PG: 1100MW    â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Module Browser Layout
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚
â”‚ â•‘                             MODULE BROWSER                                 â•‘ â”‚
â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚
â”‚ â”‚ â•‘   CATEGORIES    â•‘ â”‚ â”‚ â•‘                MODULE LIST                        â•‘ â”‚ â”‚
â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Slot Type â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€ Heavy Missile Launchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚
â”‚ â”‚ â”‚ â— High Power    â”‚ â”‚ â”‚ â”‚ [ðŸ’«] Heavy Missile Launcher II       Meta 5    â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â—‹ Medium Power  â”‚ â”‚ â”‚ â”‚ [ðŸ’«] Heavy Assault Missile Launcher II Meta 5  â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â—‹ Low Power     â”‚ â”‚ â”‚ â”‚ [â­] 'Arbalest' Heavy Missile Launcher  Meta 4 â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â—‹ Rigs          â”‚ â”‚ â”‚ â”‚ [â­] 'Malkuth' Heavy Missile Launcher   Meta 3 â”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ [âšª] Heavy Missile Launcher I           Meta 1 â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Categories â”€â”€â”€â”€â” â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”‚ â–¼ Missile Launchers â”‚ â”‚ â”Œâ”€ Module Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Heavy Missileâ”‚ â”‚ â”‚ â”‚ â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•— â”‚ â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Light Missileâ”‚ â”‚ â”‚ â”‚ â•‘ Heavy Missile Launcher II                 â•‘ â”‚ â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Rapid Light â”‚ â”‚ â”‚ â”‚ â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• â”‚ â”‚ â”‚
â”‚ â”‚ â”‚   â€¢ Rapid Heavy â”‚ â”‚ â”‚ â”‚                                               â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Turrets       â”‚ â”‚ â”‚ â”‚ Damage Multiplier: 1.0x                      â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Drones        â”‚ â”‚ â”‚ â”‚ Rate of Fire: 8.0s                           â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Electronic Warâ”‚ â”‚ â”‚ â”‚ CPU Usage: 35 tf                             â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Propulsion   â”‚ â”‚ â”‚ â”‚ Powergrid: 15 MW                             â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Shield       â”‚ â”‚ â”‚ â”‚ Charges: Heavy Missiles                       â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â–¶ Armor        â”‚ â”‚ â”‚ â”‚                                               â”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â”‚ Skill Requirements:                           â”‚ â”‚ â”‚
â”‚ â”‚                     â”‚ â”‚ â”‚ â€¢ Heavy Missiles V                            â”‚ â”‚ â”‚
â”‚ â”‚ â”Œâ”€ Meta Level â”€â”€â”€â”€â” â”‚ â”‚ â”‚ â€¢ Weapon Upgrades V                          â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â˜ Meta 1-4      â”‚ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â”‚ â”‚ â˜‘ Tech II       â”‚ â”‚ â”‚                                                       â”‚ â”‚
â”‚ â”‚ â”‚ â˜ Deadspace     â”‚ â”‚ â”‚ â”Œâ”€ Fitting Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚
â”‚ â”‚ â”‚ â˜ Officer       â”‚ â”‚ â”‚ â”‚ [âš¡ Fit to Ship] [ðŸ“‹ Copy Info] [ðŸ’¾ Save]     â”‚ â”‚ â”‚
â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Visual Style Descriptions

### Panel Design (Based on Reference Image)
Each panel should have:
- **Transparent glass-like background** with subtle cyan tint
- **Glowing cyan borders** (2-3px) with rounded corners (8-12px radius)
- **Floating appearance** with subtle drop shadows and backdrop blur
- **Header sections** with stronger cyan glow and centered titles
- **Content areas** with organized, clean layout and proper spacing

### Specific Component Styling

#### Skill Analysis Panel (Left)
```
Visual Description:
- Circular progress indicator with glowing cyan rim
- Large percentage text (75%) in white, centered
- SP value (3,467,020) below in smaller cyan text
- Category list with collapsible arrows (â–¶/â–¼)
- Each category shows level progress on right side
- Skill queue section at bottom with queue items
- All text uses futuristic font with proper letter-spacing
```

#### Ship Fitting Panel (Center) 
```
Visual Description:
- Main title "SHIP FITTING" in cyan, centered in header
- Slot sections (High/Medium/Low) with cyan divider lines
- Each slot shows:
  - Module icon/checkbox on left
  - Module name in white text
  - Quantity indicator (1X, 2X, 3X) on right in cyan
- Empty slots shown with dotted borders
- Hover effects with subtle glow animation
- All sections properly spaced with visual hierarchy
```

#### Ship Stats Panel (Right)
```
Visual Description:
- Multiple stat sections with cyan headers
- Each stat shows:
  - Icon or symbol on left
  - Stat name and value in white
  - Units in smaller cyan text
- Progress bars for power/CPU with gradient fills
- DPS prominently displayed
- All stats organized in logical groups
- Consistent spacing and alignment
```

### Animation Specifications

#### Hover Animations
- **Scale Transform**: `transform: scale(1.05)` on hover
- **Glow Intensification**: Increase box-shadow blur and spread
- **Color Transitions**: Smooth 0.3s ease transitions
- **Border Pulse**: Subtle pulsing effect on active elements

#### Loading Animations
- **Panel Fade-in**: Panels slide up and fade in with stagger effect
- **Text Typing**: Important numbers count up on load
- **Progress Bars**: Animate from 0 to actual value
- **Icon Spin**: Subtle rotation for loading indicators

#### Interactive Feedback
- **Button Press**: Scale down slightly (0.95) then return
- **List Selection**: Highlight with glowing background
- **Form Focus**: Expand border glow radius
- **Drag & Drop**: Visual feedback with opacity and scale changes

### Layout Grid System
- **12-column responsive grid** with consistent gutters
- **Panel spacing**: 20px between major sections
- **Inner padding**: 16px for panel content
- **Typography scale**: Based on 14px body text with modular scale
- **Responsive breakpoints**: Mobile-first approach with tablet/desktop variants