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

### 💰 **Market Analytics Dashboard**
- **Order Management**: Track all your buy/sell orders across regions
- **Transaction History**: Complete trading history with profit/loss analysis
- **Price Trend Analysis**: Historical price data with market insights
- **Regional Market Data**: Compare prices across all regions instantly
- **Trading Metrics**: Portfolio performance and trading effectiveness
- **Market Intelligence**: AI-powered trading recommendations

### 🏭 **Industry Management Suite**
- **Manufacturing Jobs**: Track all production jobs with completion timers
- **Blueprint Research**: Monitor ME/TE research progress across characters
- **Mining Analytics**: Detailed mining ledger with yield optimization
- **Profit Calculations**: Real-time profitability analysis for all activities
- **Resource Planning**: Material requirements for complex manufacturing

### ⚔️ **Combat & PvP Analytics**
- **Killmail Integration**: Automatic import and analysis of all killmails
- **Performance Metrics**: Track your PvP effectiveness over time
- **Loss Analysis**: Detailed breakdown of ship losses with prevention tips
- **Combat Statistics**: ISK efficiency and combat performance tracking

### 📧 **Communication Hub**
- **Mail Management**: Full EVE mail integration with advanced filtering
- **Contact Organization**: Sophisticated contact management with standings
- **Notification Center**: Centralized notifications from all game activities

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

### **Version 1.3.0 - Complete Feature Implementation**

#### 🆕 **New Major Features**
- **Market Analytics Dashboard** - Complete trading analysis with order tracking and profit calculations
- **Industry Management Suite** - Full manufacturing and mining operations management
- **Combat Analytics** - Comprehensive killmail analysis and PvP performance tracking
- **Communication Hub** - Integrated mail and contact management system

#### 🔧 **Technical Improvements**
- **Enhanced ESI Coverage** - Now supporting 40+ endpoints for comprehensive data access
- **Advanced Caching System** - Intelligent caching with 15-minute refresh cycles
- **Performance Optimization** - Concurrent data loading with graceful error handling
- **Complete Type Safety** - Full TypeScript coverage across all new components

#### 🎨 **UI/UX Enhancements**
- **Unified Navigation** - New "Analytics & Management" section in main layout
- **Real-time Metrics** - Live updating dashboards with performance indicators
- **Interactive Charts** - Advanced data visualization for all analytics features
- **Responsive Design** - Optimized for all screen sizes and resolutions

## 🚦 Installation & Setup

### **Prerequisites**
- **Node.js 18+** - JavaScript runtime
- **npm 10+** - Package manager
- **Git** - Version control

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/korallis/EVA.git
cd EVA/EVA-App

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
EVA/
├── EVA-App/               # Main application (clean, production-ready)
│   ├── src/
│   │   ├── main/          # Electron main process
│   │   │   ├── index.ts   # Application entry point
│   │   │   └── services/  # Backend services (ESI, SDE, Auth)
│   │   ├── renderer/      # React frontend
│   │   │   ├── pages/     # Application pages (7 major features)
│   │   │   ├── components/# Reusable components
│   │   │   └── layouts/   # Layout components
│   │   ├── shared/        # Shared utilities and constants
│   │   └── services/      # SDE and data services
│   ├── forge.config.ts    # Electron Forge configuration
│   └── webpack.*.config.ts# Webpack build configuration
└── README.md              # This file
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
- **Market Data** - Orders, transactions, regional markets
- **Industry Operations** - Manufacturing jobs, mining ledger
- **Combat Intelligence** - Killmails, losses, combat history
- **Communications** - Mail, contacts, notifications
- **Universe Data** - Systems, stations, types, groups

### **Authentication Scopes**
```typescript
// Essential character data
'esi-skills.read_skills.v1'
'esi-characters.read_blueprints.v1'
'esi-clones.read_clones.v1'
'esi-clones.read_implants.v1'

// Market and industry
'esi-markets.read_character_orders.v1'
'esi-wallet.read_character_wallet.v1'
'esi-industry.read_character_jobs.v1'
'esi-industry.read_character_mining.v1'

// Combat and communications
'esi-killmails.read_killmails.v1'
'esi-mail.read_mail.v1'
'esi-contacts.read_contacts.v1'

// Plus 25+ additional scopes for comprehensive coverage
```

## 🎯 Roadmap

### **Phase 1: Core Features** ✅
- [x] Character dashboard and overview
- [x] Market analytics and trading tools
- [x] Industry management suite
- [x] Combat analytics and killmail tracking
- [x] Communication hub and mail system
- [x] Enhanced clone and implant management
- [x] Blueprint library with research tracking

### **Phase 2: Advanced Analytics** 🚧
- [ ] AI-powered skill recommendations
- [ ] Intelligent ship fitting suggestions
- [ ] Market prediction algorithms
- [ ] Performance optimization recommendations

### **Phase 3: Collaboration Tools** 📋
- [ ] Multi-character management
- [ ] Corporation analytics dashboard
- [ ] Fleet coordination tools
- [ ] Shared fitting libraries

### **Phase 4: Community Features** 🌐
- [ ] Fitting import/export system
- [ ] Integration with popular EVE tools
- [ ] Community-driven content
- [ ] Plugin system for extensions

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
- **Issue Tracker** - [GitHub Issues](https://github.com/korallis/EVA/issues)

## 🎮 EVE Online Integration

EVA is designed specifically for EVE Online players and requires:
- **Active EVE Online account** for authentication
- **Internet connection** for ESI API access
- **Modern desktop environment** (Windows 10+ or macOS 10.14+)

*EVA is not affiliated with CCP Games or EVE Online. All EVE Online related materials are property of CCP Games.*

---

**Made with ❤️ for the EVE Online community**

*Fly safe, capsuleer! o7*