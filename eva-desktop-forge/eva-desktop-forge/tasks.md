# EVA Desktop Development Tasks

## Recently Completed ✅

### Documentation & Setup
- ✅ **Initial project seed** - Basic Electron Forge structure established
- ✅ **Comprehensive README.md** - Complete application documentation added
- ✅ **Removed Pyfa references** - Cleaned up documentation to focus on EVA

### Foundation Architecture
- ✅ **Electron Forge + Webpack setup** - Matching EVE launcher tech stack
- ✅ **TypeScript configuration** - Full build pipeline configured
- ✅ **Project structure** - Proper main/renderer/preload organization

### Authentication System
- ✅ **URL scheme OAuth2** - EVE SSO integration with `eva://` protocol
- ✅ **External browser flow** - Secure authentication in system browser
- ✅ **Token storage** - Encrypted credential management with electron-store
- ✅ **Character management** - ESI integration for character data

### UI Design
- ✅ **EVE launcher recreation** - Pixel-perfect visual design matching CCP's launcher
- ✅ **Three-column layout** - Left sidebar, central area, right panel
- ✅ **EVE color palette** - Orange (#ff7722) and blue (#00d4ff) theming
- ✅ **Glassmorphism effects** - Backdrop filters and proper animations
- ✅ **Character display** - Large portraits with EVE styling

---

## 🔥 IMMEDIATE PRIORITIES (Current Sprint)

### Critical Bug Fixes
- [ ] **Fix stacking penalty formula** - `exp(-i² / 7.1289)` not `exp(-(i-1)² / 2.25)`
  - **Location:** `src/services/fittingCalculator.ts:175`
  - **Impact:** 2nd damage mod shows 87% effective vs wrong 60%
  - **Est. Time:** 15 minutes
  - **Priority:** CRITICAL

### SDE Data Foundation
- [ ] **Trigger comprehensive SDE import** - Replace demo data with full EVE dataset
  - **Current Status:** Only 10 ships, 10 modules (should be 500+ ships, 2000+ modules)
  - **Location:** `src/services/comprehensiveSDEImporter.ts`
  - **Impact:** Enables all ship fitting functionality
  - **Est. Time:** 4 hours
  - **Priority:** HIGH

- [ ] **Fix missing dogma attributes** - Essential for bonus calculations
  - **Current Count:** 0 dogma attributes (should be 1000+)
  - **Impact:** No ship bonuses, skill effects, or proper calculations
  - **Est. Time:** 2 hours
  - **Priority:** HIGH

### Architecture Refactoring
- [ ] **Service layer refactor** - Break up monolithic `src/index.ts` (655 lines)
  - **Target Services:**
    - `src/main/services/CharacterService.ts` - Character management & switching
    - `src/main/services/SkillQueueService.ts` - Training queue monitoring  
    - `src/main/services/NotificationService.ts` - Desktop notifications
    - `src/main/services/SettingsService.ts` - User preferences
    - `src/main/services/CacheService.ts` - Smart caching system
  - **Impact:** Foundation for all future features
  - **Est. Time:** 6 hours
  - **Priority:** HIGH

---

## 🎯 HIGH PRIORITY (Next 2 Weeks)

### Ship Fitting System
- [ ] **Ship selection interface** - Browsable ship tree with filtering
  - **Dependencies:** Complete SDE import
  - **Est. Time:** 4 hours

- [ ] **Module drag-and-drop** - Fitting slots with visual feedback
  - **Est. Time:** 6 hours

- [ ] **Fitting validation** - CPU/power/slot constraints
  - **Est. Time:** 3 hours

- [ ] **DPS calculation accuracy** - Fix charge damage and volley calculations
  - **Location:** `src/services/fittingCalculator.ts:300`
  - **Est. Time:** 6 hours

### UI/UX Improvements
- [ ] **Chrome-style character tabs** - Replace dropdown with tab interface
  - **Features:**
    - Character portrait favicons
    - Training status indicators
    - Close buttons for unused characters
  - **Impact:** Better multi-character workflow
  - **Est. Time:** 8 hours

- [ ] **Context-sensitive right panel** - Changes based on selection
  - **Modes:**
    - Selected character → Character details
    - Selected skill → Skill training optimization
    - Selected ship → Fitting details
  - **Est. Time:** 6 hours

- [ ] **System tray integration** - Background skill monitoring
  - **Features:**
    - Training progress in tooltip
    - Quick actions menu
    - Completion notifications
  - **Est. Time:** 4 hours

### Smart Notification System
- [ ] **Background skill queue monitoring** - Poll every 5 minutes
  - **Est. Time:** 6 hours

- [ ] **Desktop notifications** - Skill completion alerts
  - **Est. Time:** 4 hours

- [ ] **Queue gap warnings** - 24 hour advance notice
  - **Est. Time:** 2 hours

---

## 🎪 MEDIUM PRIORITY (Month 2)

### Advanced Fitting Calculator
- [ ] **Target profile system** - Signature radius, velocity, resistances
  - **Est. Time:** 8 hours

- [ ] **Weapon type separation** - Turrets, missiles, drones
  - **Est. Time:** 10 hours

- [ ] **Range-based damage** - Turret falloff curves
  - **Est. Time:** 6 hours

- [ ] **Tracking calculations** - Hit probability
  - **Est. Time:** 8 hours

### Data Visualization
- [ ] **Skill progression charts** - Chart.js integration
  - **Features:**
    - SP growth over time
    - Training efficiency analysis
    - Character comparison matrices
  - **Est. Time:** 12 hours

- [ ] **Corporation skill analysis** - Heat maps and compliance tracking
  - **Est. Time:** 15 hours

### External Integration
- [ ] **EVEMon import/export** - XML file compatibility
  - **Est. Time:** 6 hours

- [ ] **Market data integration** - Injector costs and opportunity analysis
  - **Est. Time:** 8 hours

- [ ] **Doctrine compliance** - Ship doctrine tracking
  - **Est. Time:** 12 hours

---

## 🔬 ADVANCED FEATURES (Month 3+)

### Advanced EVE Integration
- [ ] **Multi-server support** - Tranquility + Serenity
  - **Est. Time:** 6 hours

- [ ] **Command pattern** - Undo/redo functionality
  - **Est. Time:** 8 hours

- [ ] **Advanced character management** - Background import with progress
  - **Est. Time:** 12 hours

### Platform Integration
- [ ] **Native platform features**
  - Windows jump list with recent characters
  - macOS dock menu integration
  - Platform-specific notifications
  - **Est. Time:** 6 hours

- [ ] **Theme system** - EVE corporation themes
  - **Est. Time:** 8 hours

- [ ] **Smart splitter positioning** - Remember panel sizes
  - **Est. Time:** 4 hours

### Performance Optimization
- [ ] **Lazy loading** - Large dataset optimization
  - **Est. Time:** 8 hours

- [ ] **Virtual scrolling** - Large list performance
  - **Est. Time:** 6 hours

- [ ] **Background processing** - Non-blocking operations
  - **Est. Time:** 6 hours

---

## 🧪 TESTING & VALIDATION

### Core Testing
- [ ] **DPS calculation test suite** - Compare with Pyfa results
  - **Est. Time:** 4 hours

- [ ] **Cross-platform testing** - Windows + macOS validation
  - **Est. Time:** 6 hours

- [ ] **Performance benchmarking** - ESI call optimization
  - **Est. Time:** 4 hours

- [ ] **User acceptance testing** - EVE community feedback
  - **Est. Time:** 8 hours

---

## 📊 CURRENT STATUS SUMMARY

### Database Status (SDE)
| Entity Type | Current | Target | Status |
|-------------|---------|--------|---------|
| Ships | 10 | 500+ | ❌ Missing |
| Modules | 10 | 2000+ | ❌ Missing |
| Dogma Attributes | 0 | 1000+ | ❌ Missing |
| Dogma Effects | 0 | 500+ | ❌ Missing |
| Skill Requirements | 0 | 1000+ | ❌ Missing |

### Feature Completion
| Feature | Status | Progress |
|---------|---------|----------|
| Authentication | ✅ Complete | 100% |
| UI Framework | ✅ Complete | 100% |
| Basic Ship Fitting | 🚧 In Progress | 30% |
| DPS Calculator | 🚧 In Progress | 60% |
| Character Management | ✅ Complete | 100% |
| SDE Integration | ❌ Blocked | 10% |

### Estimated Timeline
- **Week 1:** SDE import + critical bug fixes
- **Weeks 2-3:** Core ship fitting functionality  
- **Month 2:** Advanced calculations and UI polish
- **Month 3+:** Advanced features and community release

**Total Estimated Remaining Time:** ~120 hours over 10-12 weeks

---

## 🔄 CONTINUOUS IMPROVEMENT TASKS

- [ ] **Weekly community feedback** incorporation
- [ ] **Monthly feature usage analytics** review  
- [ ] **Quarterly roadmap** reassessment
- [ ] **CCP API changes** adaptation strategy