# EVA - EVE Virtual Assistant

![EVA Banner](https://img.shields.io/badge/EVA-EVE%20Virtual%20Assistant-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZmY3NzIyIi8+Cjwvc3ZnPg==)

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue.svg)]()
[![Development Status](https://img.shields.io/badge/status-In%20Development-yellow.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **The ultimate desktop companion for EVE Online pilots**

---

## 🚧 Development Status

**EVA is actively under development** with core features implemented and working. While the application is functional for its current feature set, several advanced features are still in progress.

---

## 🌟 What EVA Will Do

EVA transforms how you interact with EVE Online by providing a comprehensive desktop experience that goes far beyond the game client itself.

### 🎮 **Character & Skills Management**
- **Multi-Character Dashboard**: Switch between all your characters with Chrome-style tabs
- **Real-Time Skill Monitoring**: Watch your training progress with live countdowns and visual timelines
- **Smart Training Alerts**: Get desktop notifications when skills complete or queues empty
- **Skill Planning**: Analyze your character's progression and plan optimal training paths
- **SP Tracking**: Monitor total skill points and skill distribution across categories

### 🚢 **Advanced Ship Fitting & Analysis**
- **Complete Ship Database**: Access to 500+ ships with full statistics and capabilities
- **Comprehensive Module Library**: Browse 2000+ modules, weapons, and equipment
- **Drag-and-Drop Fitting**: Intuitive interface for building and testing ship configurations
- **Real-Time Calculations**: Instant DPS, EHP, capacitor, CPU, and powergrid analysis
- **Fitting Validation**: Automatic checks for skill requirements and compatibility
- **Save & Share Fittings**: Store your creations and share with corp mates

### 🏢 **Corporation & Fleet Tools** *(Planned)*
- **Member Skill Tracking**: Monitor your corporation's collective capabilities
- **Fleet Composition Analysis**: Optimize fleet setups for maximum effectiveness
- **Doctrine Compliance**: Check if members can fly required ship configurations
- **Training Coordination**: Plan corporation-wide skill development

### 📈 **Market & Economics** *(Planned)*
- **Real-Time Market Data**: Track prices across all regions and trade hubs
- **Profit Analysis**: Calculate margins for trading and manufacturing
- **Market Trends**: Historical price data and trend analysis
- **Asset Valuation**: Estimate the total value of your EVE portfolio

### 🎯 **Intelligence & Analytics** *(Planned)*
- **Combat Effectiveness**: Analyze ship performance in different scenarios
- **Character Valuation**: Estimate the market value of your characters
- **Training Optimization**: AI-powered recommendations for skill development
- **Performance Tracking**: Monitor your progression over time

---

## 🎯 Current Features (Working Now)

### ✅ **Fully Operational**
- **EVE SSO Authentication**: Secure login with your EVE Online account
- **Multi-Character Support**: Add and manage multiple characters
- **Skills Overview**: Complete view of all character skills and levels
- **Training Queue**: Visual timeline of current and queued skills
- **Ship Fitting Tool**: Working drag-and-drop interface with basic calculations
- **EVE Data Integration**: Full Static Data Export (SDE) import and management
- **System Tray**: Runs in background with minimal resource usage

### 🔧 **Partially Working**
- **DPS Calculations**: Basic damage calculations (accuracy being improved)
- **Module Compatibility**: Slot detection works for most modules
- **Real-time Updates**: Skill progress updates (some edge cases remain)

---

## ⚠️ Known Issues

### **Current Limitations**
1. **Character Attributes**: Currently uses placeholder data (ESI integration pending)
2. **DPS Accuracy**: Weapon damage calculations need refinement for complex scenarios
3. **Module Detection**: Some specialty modules may not auto-detect proper slots
4. **Large Data Imports**: Initial SDE download can take several minutes
5. **High-DPI Displays**: Some UI elements may appear small on 4K monitors

### **Performance Notes**
- First launch requires downloading 200+ MB of EVE game data
- Memory usage may increase with multiple characters active
- Background updates are optimized but use minimal system resources

---

## 🔮 Upcoming Features

### **Phase 1: Core Enhancement** *(Next 2-3 months)*
- Fix character attributes with proper ESI integration
- Improve DPS calculation accuracy for all weapon systems
- Enhanced error handling and user feedback
- Performance optimizations for large datasets

### **Phase 2: Advanced Fitting** *(3-6 months)*
- Complete fitting validation system
- Advanced ship comparison tools
- Skill requirement analysis
- Fitting optimization suggestions

### **Phase 3: Corporation Tools** *(6-12 months)*
- Corporation member management
- Fleet doctrine planning
- Skill tracking for corp members
- Training coordination tools

### **Phase 4: Market Integration** *(12+ months)*
- Real-time market data feeds
- Trading analysis tools
- Asset valuation system
- Economic forecasting

### **Phase 5: Mobile & Community** *(Future)*
- Mobile companion app
- Fitting sharing platform
- Community features
- Plugin architecture for third-party extensions

---

## 📥 Installation

**EVA will be distributed as a packaged installer** - no technical setup required!

### **System Requirements**
- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.15 (Catalina) or later
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 1GB free space (for app and EVE data)
- **Internet**: Required for EVE SSO and data updates

### **Installation Process**
1. Download the installer for your platform
2. Run the installer (no administrator rights required)
3. Launch EVA and authenticate with your EVE Online account
4. Grant necessary permissions for character data access
5. Wait for initial game data download (one-time process)
6. Start managing your EVE Online experience!

---

## 🔐 Security & Privacy

- **Zero Password Storage**: Only uses EVE's secure OAuth2 tokens
- **Local Encryption**: All sensitive data encrypted on your device
- **Minimal Permissions**: Only requests essential ESI scopes
- **No Telemetry**: No usage tracking or data collection
- **Open Source**: Code is publicly auditable for security review

---

## 🎯 Development Tasks Remaining

### **High Priority**
- [ ] Implement proper character attributes from ESI
- [ ] Improve DPS calculation accuracy
- [ ] Fix module slot detection edge cases
- [ ] Enhanced error recovery for network failures

### **Medium Priority**
- [ ] Corporation management features
- [ ] Market data integration
- [ ] Advanced fitting validation
- [ ] Performance optimization for large datasets

### **Long Term**
- [ ] Mobile companion app
- [ ] Community features and sharing
- [ ] Plugin architecture
- [ ] Machine learning recommendations

---

## ⚖️ Legal Notice

EVA is an independent third-party application developed by EVE Online players for the community. This application is not affiliated with, endorsed, sponsored, or specifically approved by CCP Games.

EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf.

---

## 🙏 Acknowledgments

- **CCP Games** for creating EVE Online and providing the ESI API
- **EVE Community** for feedback, testing, and feature suggestions  
- **Open Source Contributors** whose libraries make EVA possible

---

<div align="center">

**Made with ❤️ by EVE pilots, for EVE pilots**

*Fly safe, fly smart, fly with EVA* o7

</div>