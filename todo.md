# EVA Development Todo List

## ✅ Completed

- [x] Set up Python project structure with PyQt6 and OpenGL dependencies
- [x] Create core application framework with 3D holographic rendering base
- [x] Implement ESI authentication using OAuth2 PKCE flow
- [x] Build main application entry point and PyQt6 initialization
- [x] Create holographic main window with 3D viewport and navigation
- [x] Implement basic UI widgets (navigation, status, welcome screen)
- [x] Implement actual 3D OpenGL rendering in holographic viewport
- [x] Remove voice activation, gesture recognition, and eye tracking features from codebase
- [x] **Custom URL Protocol Handler Implementation**
  - [x] Create URLProtocolHandler class for eveauth-eva:// scheme
  - [x] Windows and macOS protocol registration
  - [x] OAuth2 callback URL processing
  - [x] Integration with existing SSO authentication flow
  - [x] AuthenticationManager for seamless auth coordination
  - [x] Test scripts and documentation

## 🚧 In Progress

None currently.

## 📋 High Priority Tasks

### Core Systems
- [ ] **Advanced Fitting Recommendation Engine** (CRITICAL FEATURE)
  - [ ] Activity-based ship/module recommendations (Mission Running, Mining, PvP, etc.)
  - [ ] Corporation/faction-aware optimization
  - [ ] Skill-aware calculations using actual trained skills + bonuses
  - [ ] Multi-vector analysis (max DPS, speed tank, long-range, shield vs armor)
  - [ ] Complete bonus integration (skill + ship + module bonuses)
  - [ ] Efficiency scoring algorithms for optimal fitting combinations

- [ ] **ESI Client Development**
  - [ ] Complete API communication with proper error handling
  - [ ] Rate limiting and caching implementation
  - [ ] Real-time character data synchronization

- [ ] **SDE Data Integration**
  - [ ] Static Data Export loading and processing
  - [ ] Ship, module, and attribute database
  - [ ] Real-time data updates and synchronization

## 📋 Medium Priority Tasks

### Core Features
- [ ] **Advanced Dogma Engine**
  - [ ] Accurate attribute calculations
  - [ ] Stacking penalty implementation
  - [ ] Skill bonus calculations
  - [ ] Ship hull bonus integration
  - [ ] Module effect processing

- [ ] **Database Layer**
  - [ ] Local SQLite data storage
  - [ ] Character data persistence
  - [ ] Fitting history and favorites
  - [ ] Performance optimization

- [ ] **Ship Fitting Calculator**
  - [ ] Real-time DPS calculations
  - [ ] Tank analysis (shield/armor/hull)
  - [ ] Capacitor simulation
  - [ ] Speed and agility calculations
  - [ ] Range and tracking analysis

## 📋 Lower Priority Tasks

### Build and Distribution
- [ ] **PyInstaller Build Pipeline**
  - [ ] Windows .exe packaging
  - [ ] macOS .app bundle creation
  - [ ] Linux AppImage support
  - [ ] Automated release pipeline

### User Experience Enhancements
- [ ] **3D Model Integration**
  - [ ] Ship wireframe models
  - [ ] Module visualization
  - [ ] Animation systems

- [ ] **Settings and Configuration**
  - [ ] User preferences
  - [ ] Hotkey customization
  - [ ] Theme options

### Advanced Features
- [ ] **Import/Export Systems**
  - [ ] EFT format support
  - [ ] DNA string handling
  - [ ] XML format compatibility
  - [ ] Clipboard integration

- [ ] **Market Data Integration**
  - [ ] Real-time pricing
  - [ ] Market analysis tools
  - [ ] Trading recommendations

## 🎯 Focus Areas

### Primary Development Focus
1. **Sophisticated Fitting Recommendations** - The core value proposition
2. **ESI Integration** - Essential for real-time data
3. **SDE Integration** - Required for accurate calculations

### Key Success Metrics
- Accurate skill-aware fitting recommendations
- Real-time performance with 3D interface
- Seamless ESI authentication and data sync
- Comprehensive bonus calculations (skills + ship + modules)

## 📝 Notes

- **Voice/Gesture/Eye Tracking**: Removed from scope - using traditional mouse/keyboard controls
- **Ship Recommendations**: Focus on sophisticated fitting optimization, not simple activity-based suggestions  
- **Bonus Integration**: Critical that all skill bonuses, ship bonuses, and module bonuses are properly calculated
- **Multi-Vector Analysis**: Must optimize for different goals (DPS, tank, range, speed, etc.)
- **Efficiency Algorithms**: Core differentiator - advanced mathematical optimization of fitting combinations

## 🚀 Next Steps

1. Start work on the Advanced Fitting Recommendation Engine
2. Define the mathematical framework for bonus calculations
3. Create the activity-based recommendation system architecture
4. Implement skill-aware optimization algorithms