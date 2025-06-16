# EVA Desktop - Complete Development Roadmap

*Prioritized based on user impact, technical debt reduction, and Pyfa analysis*

## 🔥 **IMMEDIATE PRIORITIES** (This Week - Foundation)

### 🏗️ Architecture & Code Health
- [ ] **Service Layer Refactor** - Break up monolithic `index.ts` (655 lines → clean services)
  - `src/main/services/CharacterService.ts` - Character management & switching
  - `src/main/services/SkillQueueService.ts` - Training queue monitoring
  - `src/main/services/NotificationService.ts` - Desktop notifications
  - `src/main/services/SettingsService.ts` - User preferences
  - `src/main/services/CorporationService.ts` - Multi-character corp features
  - **Impact:** Foundation for all future features
  - **Est. Time:** 6 hours

- [ ] **Smart Caching System** - Inspired by Pyfa's multi-level caching
  - Cache skill data, character portraits, corp info
  - Intelligent invalidation and offline capability
  - Reduce ESI API calls by 80%
  - **Impact:** Massive performance improvement
  - **Est. Time:** 4 hours

### 🚨 Critical DPS Fixes
- [ ] **Fix stacking penalty formula** - `exp(-i² / 7.1289)` not `exp(-(i-1)² / 2.25)`
  - **Impact:** 2nd damage mod shows 87% effective vs wrong 60%
  - **Files:** `src/services/fittingCalculator.ts:175`
  - **Est. Time:** 15 minutes

**Week 1 Goal:** Clean architecture + accurate basic calculations

---

## 🎯 **HIGH PRIORITY** (Weeks 2-3 - Core Features)

### 💻 UI/UX Overhaul (Pyfa-Inspired)
- [ ] **Chrome-Style Character Tabs** - Replace dropdown with tab interface
  - Character portrait favicons with corp logos
  - Training status indicators on tabs
  - Close buttons for unused characters
  - **Impact:** Much better multi-character workflow
  - **Est. Time:** 8 hours

- [ ] **Context-Sensitive Right Panel** - Changes based on selection
  - Selected character → Character details
  - Selected skill → Skill training optimization
  - Selected corp → Corp skill requirements
  - **Impact:** Information density and user efficiency
  - **Est. Time:** 6 hours

- [ ] **System Tray Integration** - Background skill monitoring
  - Show active training progress in tray tooltip
  - Quick actions menu (pause training, view queues)
  - Training completion notifications
  - **Impact:** "Always-on" EVE experience
  - **Est. Time:** 4 hours

### 🔔 Smart Notification System
- [ ] **Background Skill Queue Monitoring**
  - Poll all character queues every 5 minutes
  - Desktop notifications for skill completion
  - Warn about queue gaps 24 hours in advance
  - **Impact:** Never miss training again
  - **Est. Time:** 6 hours

- [ ] **Advanced Notification Types**
  - Market opportunities for trained skills
  - Corporation skill requirement updates
  - Training optimization suggestions
  - **Est. Time:** 4 hours

### ⚡ Core Feature Improvements
- [ ] **Plugin-Based Skill Views** - Modular skill display system
  - SkillTreeView (visual dependencies)
  - SkillQueueView (current training)
  - SkillPlanView (long-term plans)
  - SkillCompareView (character comparison)
  - CorporationView (corp requirements)
  - **Impact:** Customizable user experience
  - **Est. Time:** 10 hours

- [ ] **EVEMon Import/Export** - Tap into existing user base
  - Import EVEMon character XML files
  - Export training plans in compatible format
  - **Impact:** Easy migration for existing users
  - **Est. Time:** 6 hours

---

## 🎪 **MEDIUM PRIORITY** (Month 2 - Advanced Features)

### 🧮 Fitting Calculator Accuracy
- [ ] **Implement proper volley-based DPS calculation**
  - Separate volley calculation from cycle timing
  - Add charge damage for turret weapons
  - **Files:** `src/services/fittingCalculator.ts:300`
  - **Est. Time:** 6 hours

- [ ] **Target Profile System**
  - Signature radius, velocity, resistances
  - Target type presets (frigate, cruiser, battleship)
  - Real damage application calculations
  - **Est. Time:** 8 hours

- [ ] **Weapon Type Separation**
  - Turret weapons (projectile, hybrid, energy)
  - Missile weapons (all sizes)
  - Drone weapons (separate calculation)
  - **Est. Time:** 10 hours

### 📊 Data Visualization & Analysis
- [ ] **Skill Progression Charts** - Chart.js integration
  - SP growth over time per character
  - Training efficiency analysis
  - Character comparison matrices
  - **Impact:** Data-driven training decisions
  - **Est. Time:** 12 hours

- [ ] **Corporation Skill Analysis**
  - Skill coverage heat maps
  - Doctrine compliance tracking
  - Training coordination tools
  - **Impact:** Corp management capabilities
  - **Est. Time:** 15 hours

### 🔗 External Integration
- [ ] **Market Data Integration**
  - Show injector costs for instant training
  - Calculate opportunity costs of training paths
  - Track character value based on SP
  - **Est. Time:** 8 hours

- [ ] **Doctrine Compliance System**
  - Import ship doctrines from EVE
  - Track which characters can fly doctrines
  - Plan training to meet requirements
  - **Impact:** Fleet readiness management
  - **Est. Time:** 12 hours

---

## 🔬 **ADVANCED FEATURES** (Month 3+ - Polish & Power Features)

### 🎮 Advanced EVE Integration
- [ ] **Multi-Server Support** - Tranquility + Serenity
  - Separate character management per server
  - Server-specific skill data caching
  - **Est. Time:** 6 hours

- [ ] **Command Pattern for Undo/Redo**
  - Undo character switches
  - Rollback skill queue changes
  - Batch operations with rollback
  - **Est. Time:** 8 hours

- [ ] **Advanced Character Management**
  - Background character import with progress
  - Skill comparison between characters
  - Corporate roster management
  - **Est. Time:** 12 hours

### 🎨 UI Polish & Advanced Features
- [ ] **Native Platform Integration**
  - Windows jump list with recent characters
  - macOS dock menu integration
  - Platform-specific notification styles
  - **Est. Time:** 6 hours

- [ ] **Advanced Settings & Customization**
  - Theme system with EVE corporation themes
  - Customizable notification preferences
  - Advanced caching controls
  - **Est. Time:** 8 hours

- [ ] **Smart Splitter Positioning** - Remember panel sizes
  - Persistent layout preferences
  - Context-aware panel sizing
  - **Est. Time:** 4 hours

### 📈 Data & Performance
- [ ] **Comprehensive SDE Import**
  - Complete weapon charge data
  - Ship role bonuses from descriptions
  - Weapon effect data and dogma
  - **Est. Time:** 15 hours

- [ ] **Performance Optimization**
  - Lazy loading for large datasets
  - Virtual scrolling for large lists
  - Background processing optimization
  - **Est. Time:** 8 hours

---

## 🔧 **FITTING CALCULATOR IMPROVEMENTS** (Parallel Track)

### Mathematical Accuracy
- [ ] **Range-based damage calculations** - Turret falloff curves
- [ ] **Missile damage application** - Explosion mechanics
- [ ] **Attribute Modification System** - Proper bonus stacking
- [ ] **Skill bonus integration** - Use character skill data
- [ ] **Ship hull bonuses** - Role bonuses from descriptions

### Advanced Mechanics
- [ ] **Tracking calculations** - Hit probability
- [ ] **Capacitor warfare** - Neut/vamp effects
- [ ] **Drone and fighter DPS** - Complete calculation system
- [ ] **Specialized weapons** - Spool-up, smartbombs, doomsdays

---

## 🧪 **TESTING & VALIDATION**

- [ ] **DPS Calculation Test Suite** - Compare with Pyfa results
- [ ] **Cross-platform Testing** - Windows + macOS validation  
- [ ] **Performance Benchmarking** - ESI call optimization
- [ ] **User Acceptance Testing** - EVE community feedback

---

## 📊 **ESTIMATED TIMELINE**

| Phase | Duration | Features |
|-------|----------|----------|
| **Foundation** | Week 1 | Service refactor, caching, DPS fixes |
| **Core Features** | Weeks 2-3 | Character tabs, notifications, skill views |
| **Advanced** | Month 2 | Charts, corp features, integrations |
| **Polish** | Month 3+ | Platform integration, performance |

**Total Estimated Time:** ~150 hours over 3 months

---

## 🎯 **SUCCESS METRICS**

### Week 1 Targets:
- ✅ Clean service architecture in place
- ✅ 90%+ DPS calculation accuracy  
- ✅ 80% reduction in ESI API calls

### Month 1 Targets:
- ✅ Chrome-style character management
- ✅ Background skill monitoring active
- ✅ EVEMon import working

### Month 3 Targets:
- ✅ Full Pyfa-level feature parity for character management
- ✅ Unique features that differentiate from EVEMon
- ✅ Ready for EVE community beta release

---

## 🔄 **CONTINUOUS IMPROVEMENT**

- [ ] **Weekly community feedback** incorporation
- [ ] **Monthly feature usage analytics** review
- [ ] **Quarterly roadmap** reassessment based on EVE game updates
- [ ] **CCP API changes** adaptation strategy

---

# SDE Data Status (16 June 2025)

**Current SDE database (eve-sde.db) contains only demo/test data.**

| Entity Type         | Count |
|---------------------|-------|
| Categories          | 3     |
| Groups              | 8     |
| Market Groups       | 0     |
| Ships               | 10    |
| Modules (all types) | 10    |
| Dogma Attributes    | 0     |
| Dogma Effects       | 0     |
| Type Attributes     | 0     |
| Type Effects        | 0     |
| Skill Requirements  | 0     |
| Fittings            | 0     |

**Why is this so small?**
- The app is currently loading only demo/test data into the SDE database.
- The full EVE SDE (which is very large) has not been imported or the import did not complete successfully.
- To get full data, ensure the comprehensive SDE import runs with access to all CCP SDE YAML files and completes without errors.

---