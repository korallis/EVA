# EVA (EVE Virtual Assistant)

A comprehensive **native desktop application** built with **Electron Forge** for EVE Online players, providing real-time character management, ship fitting tools, and advanced analytics through the EVE Online ESI API.

![EVA Desktop Application](https://img.shields.io/badge/EVE%20Online-Desktop%20App-orange?style=for-the-badge&logo=electron)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-lightgrey?style=for-the-badge)

## 🚀 Features

### 📊 **Comprehensive Character Dashboard**
- **Real-time character overview** with live ESI data integration
- **Skill progression tracking** with 25.7M+ SP management
- **Corporation information** and membership history
- **Wallet balance** and asset monitoring
- **Current ship and location** with system security status
- **Training queue** with time remaining calculations

### 🧬 **Advanced Clone Management**
- **Home clone location** tracking with station/structure resolution
- **Jump clone inventory** with implant sets and locations
- **Clone jump timers** and fatigue tracking
- **Neural remap history** (framework ready)

### 💉 **Enhanced Implant System**
- **Slot-based implant display** with proper categorization
- **Implant name resolution** from Static Data Export (SDE)
- **Timer support** for temporary implants and boosters
- **Attribute bonus tracking** (framework ready)

### 📜 **Blueprint Library Management**
- **BPO/BPC inventory** with comprehensive statistics
- **Material & Time Efficiency** research progress tracking
- **Runs remaining** for Blueprint Copies
- **Research status indicators** with completion percentages
- **Location tracking** for accessible blueprints

### 🎯 **Ship Fitting Tools**
- **Interactive fitting interface** with drag-and-drop modules
- **DPS calculations** using authentic EVE Dogma mechanics
- **Fitting validation** (CPU/Power/Slots)
- **Ship bonuses** and skill effect calculations
- **Comprehensive SDE integration** (550+ ships, 5900+ modules)

### 🔐 **Secure Authentication**
- **EVE SSO integration** with external browser flow
- **URL scheme callbacks** (`eva://auth/callback`)
- **Encrypted token storage** using electron-store
- **Automatic token refresh** with 24/7 monitoring
- **Multi-character support** (framework ready)

## 🛠️ Technology Stack

### **Desktop Framework**
- **Electron Forge** - Production-ready desktop app packaging
- **React 18.2.0** - Modern frontend with TypeScript
- **Webpack** - Module bundling and asset optimization
- **Node.js** - Backend services and ESI integration

### **Data & APIs**
- **EVE Online ESI API** - Real-time character data
- **SQLite** - Local SDE database (107MB optimized)
- **Static Data Export** - Complete EVE universe data
- **Dogma Engine** - Authentic fitting calculations

### **Design System**
- **EVE Launcher Recreation** - Pixel-perfect visual design
- **Holographic UI** - Glassmorphism effects and animations
- **Space Theme** - Authentic EVE Online color palette
- **Responsive Layout** - Adaptive to window sizing

## 📋 Recent Updates

### **Version 1.2.0 - Dashboard Enhancement Update**

#### 🆕 **New Features**
- **Blueprint Library Panel** - Complete BPO/BPC management with ME/TE tracking
- **Enhanced Clone Management** - Jump clone inventory with implant details
- **Improved Implant Display** - Slot-based layout with name resolution
- **SDE Statistics Integration** - Database status with ship/module counts

#### 🔧 **Technical Improvements**
- **Extended ESI Scope Coverage** - 25+ scopes for comprehensive data access
- **Enhanced Caching System** - 15-minute cache for blueprint/clone data
- **Type-Safe API Integration** - Full TypeScript coverage for new endpoints
- **Performance Optimization** - Concurrent data loading with graceful fallbacks

#### 🎨 **UI/UX Enhancements**
- **Research Progress Visualization** - ME/TE efficiency bars and percentages
- **Blueprint Type Distinction** - Visual indicators for BPOs vs BPCs
- **Clone Location Resolution** - Station/structure names from universe data
- **Timer Display Framework** - Ready for implant expiration tracking

## 🚦 Installation & Setup

### **Prerequisites**
- **Node.js 18+** - JavaScript runtime
- **npm 10+** - Package manager
- **Git** - Version control

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/your-username/eva-desktop-forge.git
cd eva-desktop-forge/eva-desktop-forge

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run make
```

### **First Run Setup**
1. **Launch EVA** - Application will open with EVE-themed interface
2. **Connect to EVE Online** - Click "Connect to EVE Online" button
3. **Authenticate** - Complete EVE SSO in your default browser
4. **Data Loading** - SDE database will initialize automatically
5. **Dashboard Ready** - Full character overview available

## 🔧 Development

### **Project Structure**
```
eva-desktop-forge/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Application entry point
│   │   └── services/      # Backend services (ESI, SDE, Auth)
│   ├── renderer/          # React frontend
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable components
│   │   └── layouts/       # Layout components
│   ├── shared/            # Shared utilities and constants
│   └── services/          # SDE and data services
├── forge.config.ts        # Electron Forge configuration
└── webpack.*.config.ts    # Webpack build configuration
```

### **Available Scripts**
```bash
npm start          # Start development server
npm run make       # Create distributables
npm run package    # Package for current platform
npm run lint       # Code quality checks
npm test           # Run test suite
```

### **Architecture Principles**
- **Main Process** - ESI API calls, secure token storage, native features
- **Renderer Process** - React UI, user interactions, data visualization
- **IPC Communication** - Secure bridge between main and renderer
- **Service Architecture** - Modular backend with dependency injection

## 📊 ESI Integration

### **Supported Endpoints**
- **Character Data** - Skills, attributes, corporation, wallet
- **Location Services** - Current ship, system, station/structure
- **Clone Management** - Home clone, jump clones, implants
- **Blueprint Library** - BPOs, BPCs, research status
- **Universe Data** - Systems, stations, types, groups

### **Authentication Scopes**
```typescript
// Essential character data
'esi-skills.read_skills.v1'
'esi-characters.read_blueprints.v1'
'esi-clones.read_clones.v1'
'esi-clones.read_implants.v1'

// Location and assets
'esi-location.read_location.v1'
'esi-assets.read_assets.v1'
'esi-wallet.read_character_wallet.v1'

// Plus 18 additional scopes for comprehensive coverage
```

## 🎯 Roadmap

### **Phase 1: Core Enhancement** ✅
- [x] Blueprint management system
- [x] Enhanced clone tracking  
- [x] Improved implant display
- [x] SDE statistics integration

### **Phase 2: Fitting Tools** 🚧
- [ ] Dedicated ship fitting page
- [ ] Module browser with filtering
- [ ] Fitting validation and optimization
- [ ] DPS calculation improvements

### **Phase 3: Advanced Features** 📋
- [ ] Multi-character management
- [ ] Skill planning with interactive tree
- [ ] Market integration and analysis
- [ ] Fleet coordination tools

### **Phase 4: Community** 🌐
- [ ] Fitting sharing and import/export
- [ ] Integration with popular EVE tools
- [ ] Plugin system for extensions
- [ ] Community feedback integration

## 🤝 Contributing

We welcome contributions from the EVE Online community! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### **Development Setup**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **EVE Online** - [Official Website](https://www.eveonline.com/)
- **ESI Documentation** - [EVE Swagger Interface](https://esi.evetech.net/ui/)
- **Electron Forge** - [Documentation](https://www.electronforge.io/)
- **Issue Tracker** - [GitHub Issues](https://github.com/your-username/eva-desktop-forge/issues)

## 🎮 EVE Online Integration

EVA is designed specifically for EVE Online players and requires:
- **Active EVE Online account** for authentication
- **Internet connection** for ESI API access
- **Modern desktop environment** (Windows 10+ or macOS 10.14+)

*EVA is not affiliated with CCP Games or EVE Online. All EVE Online related materials are property of CCP Games.*

---

**Made with ❤️ for the EVE Online community**

*Fly safe, capsuleer! o7*