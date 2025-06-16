import React, { useState, useEffect } from 'react';
import './ShipFitting.css';

interface Ship {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  raceID?: number;
  raceName?: string;
}

interface Module {
  typeID: number;
  typeName: string;
  groupID: number;
  groupName: string;
  metaLevel: number;
  techLevel: number;
}

interface FittingSlot {
  slotType: 'high' | 'mid' | 'low' | 'rig' | 'subsystem' | 'service';
  index: number;
  moduleTypeID?: number;
  moduleName?: string;
  online: boolean;
}

interface ShipStats {
  typeID: number;
  name: string;
  cpu: number;
  powergrid: number;
  capacitor: number;
  highSlots: number;
  midSlots: number;
  lowSlots: number;
  rigSlots: number;
  shieldHP: number;
  armorHP: number;
  hullHP: number;
  mass: number;
  maxVelocity: number;
}

interface FittingStats {
  dps: number;
  ehp: {
    total: number;
    shield: number;
    armor: number;
    hull: number;
  };
  cpu: {
    used: number;
    total: number;
    percentage: number;
  };
  powergrid: {
    used: number;
    total: number;
    percentage: number;
  };
  capStable: boolean;
  capTime: number;
  maxSpeed: number;
  slotsUsed: {
    high: number;
    mid: number;
    low: number;
    rig: number;
  };
  slotsTotal: {
    high: number;
    mid: number;
    low: number;
    rig: number;
  };
}

const ShipFitting: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [shipStats, setShipStats] = useState<ShipStats | null>(null);
  const [fitting, setFitting] = useState<FittingSlot[]>([]);
  const [fittingStats, setFittingStats] = useState<FittingStats | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [importingSDe, setImportingSDe] = useState(false);
  const [refreshingDatabase, setRefreshingDatabase] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [fittingName, setFittingName] = useState('');
  const [savedFittings, setSavedFittings] = useState<any[]>([]);
  
  const [searchShip, setSearchShip] = useState('');
  const [searchModule, setSearchModule] = useState('');
  const [selectedRace, setSelectedRace] = useState<string>('all');
  const [selectedShipGroup, setSelectedShipGroup] = useState<string>('all');
  const [selectedModuleGroup, setSelectedModuleGroup] = useState<string>('all');
  
  // SDE Management state
  const [sdeVersionInfo, setSdeVersionInfo] = useState<any>(null);
  const [installedVersionInfo, setInstalledVersionInfo] = useState<any>(null);
  const [downloadingSDe, setDownloadingSDe] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<any>(null);
  const [parsingSDe, setParsingSDe] = useState(false);

  useEffect(() => {
    initializeFitting();
    checkSDEVersions();
  }, []);

  useEffect(() => {
    if (selectedShip) {
      loadShipStatsAndInitialize();
    }
  }, [selectedShip]);

  useEffect(() => {
    if (selectedShip && fitting.length > 0) {
      calculateFittingStats();
    }
  }, [fitting, selectedShip]);

  const initializeFitting = async () => {
    setLoading(true);
    try {
      console.log('🔄 Initializing ship fitting...');
      
      // Initialize SDE database
      await window.electronAPI.sde.initialize();
      
      // Load ships and modules
      const [shipsData, modulesData] = await Promise.all([
        window.electronAPI.sde.getShips(),
        window.electronAPI.sde.getModules()
      ]);
      
      setShips(shipsData);
      setModules(modulesData);
      
      console.log('✅ Fitting initialized:', shipsData.length, 'ships,', modulesData.length, 'modules');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize fitting:', error);
      setError(error.message || 'Failed to initialize fitting system');
    } finally {
      setLoading(false);
    }
  };

  const loadShipStats = async () => {
    if (!selectedShip) return;
    
    try {
      const attributes = await window.electronAPI.sde.getTypeAttributes(selectedShip.typeID);
      const attrMap = new Map(attributes.map((attr: any) => [attr.attributeID, attr.value]));
      
      const stats: ShipStats = {
        typeID: selectedShip.typeID,
        name: selectedShip.typeName,
        cpu: attrMap.get(48) || 0,
        powergrid: attrMap.get(11) || 0,
        capacitor: attrMap.get(482) || 0,
        highSlots: attrMap.get(14) || 0,
        midSlots: attrMap.get(13) || 0,
        lowSlots: attrMap.get(12) || 0,
        rigSlots: attrMap.get(1137) || 0,
        shieldHP: attrMap.get(263) || 0,
        armorHP: attrMap.get(265) || 0,
        hullHP: attrMap.get(9) || 0,
        mass: attrMap.get(4) || 1000000,
        maxVelocity: attrMap.get(37) || 0
      };
      
      setShipStats(stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to load ship stats:', error);
      return null;
    }
  };

  const loadShipStatsAndInitialize = async () => {
    if (!selectedShip) return;
    
    try {
      const stats = await loadShipStats();
      if (stats) {
        initializeEmptyFittingWithStats(stats);
      }
    } catch (error) {
      console.error('❌ Failed to load ship and initialize fitting:', error);
    }
  };

  const initializeEmptyFitting = () => {
    if (!shipStats) return;
    
    const slots: FittingSlot[] = [];
    
    // Create empty slots
    for (let i = 0; i < shipStats.highSlots; i++) {
      slots.push({ slotType: 'high', index: i, online: false });
    }
    for (let i = 0; i < shipStats.midSlots; i++) {
      slots.push({ slotType: 'mid', index: i, online: false });
    }
    for (let i = 0; i < shipStats.lowSlots; i++) {
      slots.push({ slotType: 'low', index: i, online: false });
    }
    for (let i = 0; i < shipStats.rigSlots; i++) {
      slots.push({ slotType: 'rig', index: i, online: false });
    }
    
    setFitting(slots);
  };

  const initializeEmptyFittingWithStats = (stats: ShipStats) => {
    const slots: FittingSlot[] = [];
    
    // Create empty slots
    for (let i = 0; i < stats.highSlots; i++) {
      slots.push({ slotType: 'high', index: i, online: false });
    }
    for (let i = 0; i < stats.midSlots; i++) {
      slots.push({ slotType: 'mid', index: i, online: false });
    }
    for (let i = 0; i < stats.lowSlots; i++) {
      slots.push({ slotType: 'low', index: i, online: false });
    }
    for (let i = 0; i < stats.rigSlots; i++) {
      slots.push({ slotType: 'rig', index: i, online: false });
    }
    
    setFitting(slots);
  };

  const calculateFittingStats = async () => {
    if (!selectedShip || !shipStats || fitting.length === 0) {
      // Set base ship stats when no modules fitted
      if (selectedShip && shipStats) {
        const baseStats: FittingStats = {
          dps: 0,
          ehp: {
            total: shipStats.shieldHP + shipStats.armorHP + shipStats.hullHP,
            shield: shipStats.shieldHP,
            armor: shipStats.armorHP,
            hull: shipStats.hullHP
          },
          cpu: {
            used: 0,
            total: shipStats.cpu,
            percentage: 0
          },
          powergrid: {
            used: 0,
            total: shipStats.powergrid,
            percentage: 0
          },
          capStable: true,
          capTime: 0,
          maxSpeed: shipStats.maxVelocity,
          slotsUsed: { high: 0, mid: 0, low: 0, rig: 0 },
          slotsTotal: {
            high: shipStats.highSlots,
            mid: shipStats.midSlots,
            low: shipStats.lowSlots,
            rig: shipStats.rigSlots
          }
        };
        setFittingStats(baseStats);
      }
      return;
    }
    
    try {
      // Get fitted modules data
      const fittedModules = fitting.filter(slot => slot.moduleTypeID && slot.online);
      const moduleStatsPromises = fittedModules.map(async (slot) => {
        const attributes = await window.electronAPI.sde.getTypeAttributes(slot.moduleTypeID!);
        return { slot, attributes };
      });
      
      const moduleData = await Promise.all(moduleStatsPromises);
      
      // Calculate CPU and PowerGrid usage
      const cpuUsed = moduleData.reduce((sum, mod) => {
        const cpuAttr = mod.attributes.find((attr: any) => attr.attributeID === 50);
        return sum + (cpuAttr?.value || 0);
      }, 0);
      
      const pgUsed = moduleData.reduce((sum, mod) => {
        const pgAttr = mod.attributes.find((attr: any) => attr.attributeID === 30);
        return sum + (pgAttr?.value || 0);
      }, 0);
      
      // Calculate DPS from weapons
      const weaponModules = moduleData.filter(mod => 
        mod.slot.slotType === 'high' && 
        mod.attributes.some((attr: any) => attr.attributeID === 114) // Damage multiplier
      );
      
      let totalDPS = 0;
      for (const weapon of weaponModules) {
        const damageMultiplier = weapon.attributes.find((attr: any) => attr.attributeID === 114)?.value || 1;
        const rateOfFire = weapon.attributes.find((attr: any) => attr.attributeID === 51)?.value || 10000; // ms
        const emDamage = weapon.attributes.find((attr: any) => attr.attributeID === 212)?.value || 0;
        const explosiveDamage = weapon.attributes.find((attr: any) => attr.attributeID === 213)?.value || 0;
        const kineticDamage = weapon.attributes.find((attr: any) => attr.attributeID === 214)?.value || 0;
        const thermalDamage = weapon.attributes.find((attr: any) => attr.attributeID === 215)?.value || 0;
        
        const totalWeaponDamage = (emDamage + explosiveDamage + kineticDamage + thermalDamage) * damageMultiplier;
        const weaponDPS = (totalWeaponDamage * 1000) / rateOfFire; // Convert ms to seconds
        totalDPS += weaponDPS;
      }
      
      // Apply damage bonuses from weapon upgrade modules
      const weaponUpgrades = moduleData.filter(mod => 
        mod.slot.slotType === 'low' && 
        mod.attributes.some((attr: any) => attr.attributeID === 204) // Damage bonus
      );
      
      let damageBonus = 1.0;
      for (const upgrade of weaponUpgrades) {
        const bonus = upgrade.attributes.find((attr: any) => attr.attributeID === 204)?.value || 1;
        damageBonus *= bonus;
      }
      totalDPS *= damageBonus;
      
      // Calculate EHP with defensive modules
      let shieldHP = shipStats.shieldHP;
      let armorHP = shipStats.armorHP;
      let hullHP = shipStats.hullHP;
      
      // Shield extenders
      const shieldExtenders = moduleData.filter(mod => 
        mod.attributes.some((attr: any) => attr.attributeID === 68) // Shield bonus
      );
      for (const extender of shieldExtenders) {
        const bonus = extender.attributes.find((attr: any) => attr.attributeID === 68)?.value || 0;
        shieldHP += bonus;
      }
      
      // Armor plates
      const armorPlates = moduleData.filter(mod => 
        mod.attributes.some((attr: any) => attr.attributeID === 84) // Armor bonus
      );
      for (const plate of armorPlates) {
        const bonus = plate.attributes.find((attr: any) => attr.attributeID === 84)?.value || 0;
        armorHP += bonus;
      }
      
      // Count fitted slots
      const slotCounts = fitting.reduce((acc, slot) => {
        if (slot.moduleTypeID && slot.slotType in acc) {
          (acc as any)[slot.slotType]++;
        }
        return acc;
      }, { high: 0, mid: 0, low: 0, rig: 0 });
      
      const stats: FittingStats = {
        dps: Math.round(totalDPS * 100) / 100,
        ehp: {
          total: Math.round(shieldHP + armorHP + hullHP),
          shield: Math.round(shieldHP),
          armor: Math.round(armorHP),
          hull: Math.round(hullHP)
        },
        cpu: {
          used: Math.round(cpuUsed * 100) / 100,
          total: shipStats.cpu,
          percentage: Math.round((cpuUsed / shipStats.cpu) * 10000) / 100
        },
        powergrid: {
          used: Math.round(pgUsed * 100) / 100,
          total: shipStats.powergrid,
          percentage: Math.round((pgUsed / shipStats.powergrid) * 10000) / 100
        },
        capStable: cpuUsed <= shipStats.cpu && pgUsed <= shipStats.powergrid,
        capTime: 0, // Would need capacitor simulation
        maxSpeed: shipStats.maxVelocity,
        slotsUsed: slotCounts,
        slotsTotal: {
          high: shipStats.highSlots,
          mid: shipStats.midSlots,
          low: shipStats.lowSlots,
          rig: shipStats.rigSlots
        }
      };
      
      setFittingStats(stats);
      console.log('📊 Fitting stats calculated:', { DPS: stats.dps, EHP: stats.ehp.total, CPU: `${stats.cpu.used}/${stats.cpu.total}`, PG: `${stats.powergrid.used}/${stats.powergrid.total}` });
      
    } catch (error) {
      console.error('❌ Failed to calculate fitting stats:', error);
    }
  };

  const addModuleToSlot = (slotType: string, slotIndex: number, module: Module) => {
    setFitting(prev => prev.map(slot => {
      if (slot.slotType === slotType && slot.index === slotIndex) {
        return {
          ...slot,
          moduleTypeID: module.typeID,
          moduleName: module.typeName,
          online: true
        };
      }
      return slot;
    }));
  };

  const removeModuleFromSlot = (slotType: string, slotIndex: number) => {
    setFitting(prev => prev.map(slot => {
      if (slot.slotType === slotType && slot.index === slotIndex) {
        return {
          ...slot,
          moduleTypeID: undefined,
          moduleName: undefined,
          online: false
        };
      }
      return slot;
    }));
  };

  // EVEShipFit-style module interaction: double-click to add modules automatically
  const handleModuleDoubleClick = async (module: Module) => {
    if (!selectedShip || !shipStats) {
      console.log('No ship selected');
      return;
    }

    try {
      // Determine the slot type for this module based on its group
      const slotType = determineModuleSlotType(module);
      if (!slotType) {
        console.log('Could not determine slot type for module:', module.typeName);
        return;
      }

      // Find the first empty slot of the appropriate type
      const targetSlot = fitting.find(slot => 
        slot.slotType === slotType && !slot.moduleTypeID
      );

      if (!targetSlot) {
        console.log(`No empty ${slotType} slots available`);
        return;
      }

      // Add the module to the slot
      addModuleToSlot(slotType, targetSlot.index, module);
      console.log(`Added ${module.typeName} to ${slotType} slot ${targetSlot.index}`);
      
    } catch (error) {
      console.error('Failed to add module:', error);
    }
  };

  // Determine slot type based on module group (EVE Dogma-style)
  const determineModuleSlotType = (module: Module): string | null => {
    const groupName = module.groupName.toLowerCase();
    
    // High power modules
    if (groupName.includes('energy weapon') || 
        groupName.includes('projectile weapon') ||
        groupName.includes('hybrid weapon') ||
        groupName.includes('missile launcher') ||
        groupName.includes('turret') ||
        groupName.includes('launcher') ||
        groupName.includes('energy') ||
        groupName.includes('projectile') ||
        groupName.includes('hybrid')) {
      return 'high';
    }
    
    // Mid power modules  
    if (groupName.includes('shield') ||
        groupName.includes('electronic') ||
        groupName.includes('propulsion') ||
        groupName.includes('capacitor') ||
        groupName.includes('sensor') ||
        groupName.includes('target') ||
        groupName.includes('warp') ||
        groupName.includes('afterburner') ||
        groupName.includes('microwarpdrive')) {
      return 'mid';
    }
    
    // Low power modules
    if (groupName.includes('armor') ||
        groupName.includes('hull') ||
        groupName.includes('damage control') ||
        groupName.includes('power') ||
        groupName.includes('reactor') ||
        groupName.includes('gyrostabilizer') ||
        groupName.includes('heat sink') ||
        groupName.includes('magnetic field') ||
        groupName.includes('ballistic control') ||
        groupName.includes('overdrive') ||
        groupName.includes('nanofiber') ||
        groupName.includes('reinforced')) {
      return 'low';
    }
    
    // Rig modules
    if (groupName.includes('rig')) {
      return 'rig';
    }
    
    // Default fallback - try to guess based on common patterns
    if (module.groupID) {
      // These are common EVE module group IDs
      if ([74, 75, 76].includes(module.groupID)) return 'high';  // Turrets/Launchers
      if ([77, 78, 79, 80].includes(module.groupID)) return 'mid';  // Electronics/Shield
      if ([88, 89, 90].includes(module.groupID)) return 'low';   // Armor/Hull/Power
    }
    
    return null;
  };

  const handleSDEImport = async () => {
    setImportingSDe(true);
    try {
      const result = await window.electronAPI.sde.import();
      if (result.success) {
        alert('SDE data imported successfully! Refreshing ship and module lists...');
        // Reload ships and modules
        await initializeFitting();
      } else {
        alert(`Failed to import SDE: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import SDE data');
    } finally {
      setImportingSDe(false);
    }
  };

  const handleRefreshDatabase = async () => {
    setRefreshingDatabase(true);
    try {
      const result = await window.electronAPI.sde.clearDatabase();
      if (result.success) {
        alert('Database refreshed successfully! Loading new comprehensive data...');
        // Reload ships and modules with new data
        await initializeFitting();
      } else {
        alert(`Failed to refresh database: ${result.error}`);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh database');
    } finally {
      setRefreshingDatabase(false);
    }
  };

  // SDE Management Functions
  const checkSDEVersions = async () => {
    try {
      const [latest, installed] = await Promise.all([
        window.electronAPI.sde.checkVersion(),
        window.electronAPI.sde.getInstalledVersion()
      ]);
      setSdeVersionInfo(latest);
      setInstalledVersionInfo(installed);
    } catch (error) {
      console.error('Failed to check SDE versions:', error);
    }
  };

  const handleDownloadSDE = async () => {
    setDownloadingSDe(true);
    setDownloadProgress(null);
    
    try {
      // Set up progress listener
      window.electronAPI.sde.onDownloadProgress((progress) => {
        setDownloadProgress(progress);
      });

      const result = await window.electronAPI.sde.download();
      
      if (result.success) {
        alert('SDE download completed successfully!');
        await checkSDEVersions();
        await handleParseSDE(); // Automatically parse after download
      } else {
        alert(`SDE download failed: ${result.error}`);
      }
    } catch (error) {
      console.error('SDE download error:', error);
      alert('Failed to download SDE');
    } finally {
      setDownloadingSDe(false);
      setDownloadProgress(null);
      window.electronAPI.sde.removeDownloadProgressListener();
    }
  };

  const handleParseSDE = async () => {
    setParsingSDe(true);
    try {
      const stats = await window.electronAPI.sde.parse();
      alert(`SDE parsing completed!\nShips: ${stats.ships}\nModules: ${stats.modules}\nAttributes: ${stats.attributes}\nVersion: ${stats.version}`);
      
      // Reload ships and modules with new data
      await initializeFitting();
    } catch (error) {
      console.error('SDE parsing error:', error);
      alert('Failed to parse SDE data');
    } finally {
      setParsingSDe(false);
    }
  };

  const handleSaveFitting = async () => {
    if (!selectedShip || fitting.length === 0) {
      alert('Please select a ship and add some modules before saving');
      return;
    }
    setShowSaveDialog(true);
  };

  const saveFitting = async () => {
    if (!fittingName.trim()) {
      alert('Please enter a fitting name');
      return;
    }

    try {
      const fittingData = {
        shipTypeID: selectedShip!.typeID,
        shipName: selectedShip!.typeName,
        fittingName: fittingName.trim(),
        slots: fitting
      };

      await window.electronAPI.fitting.save(fittingData);
      alert('Fitting saved successfully!');
      setShowSaveDialog(false);
      setFittingName('');
      // Refresh saved fittings list
      await loadSavedFittings();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save fitting');
    }
  };

  const handleLoadFitting = async () => {
    await loadSavedFittings();
    setShowLoadDialog(true);
  };

  const loadSavedFittings = async () => {
    try {
      const fittings = await window.electronAPI.fitting.getFittings();
      setSavedFittings(fittings);
    } catch (error) {
      console.error('Load fittings error:', error);
      alert('Failed to load saved fittings');
    }
  };

  const loadFitting = async (fittingData: any) => {
    try {
      // Find the ship
      const ship = ships.find(s => s.typeID === fittingData.shipTypeID);
      if (!ship) {
        alert('Ship not found in current database. Please import SDE data.');
        return;
      }

      // Set the ship and fitting
      setSelectedShip(ship);
      setFitting(fittingData.slots || []);
      setShowLoadDialog(false);
      
      alert(`Fitting "${fittingData.fittingName}" loaded successfully!`);
    } catch (error) {
      console.error('Load fitting error:', error);
      alert('Failed to load fitting');
    }
  };

  const handleModuleDrop = (e: React.DragEvent, slotType: string, slotIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
      const moduleData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (moduleData && moduleData.typeID) {
        // Validate slot compatibility
        if (isModuleCompatibleWithSlot(moduleData, slotType)) {
          addModuleToSlot(slotType, slotIndex, moduleData);
          console.log('✅ Module fitted:', moduleData.typeName, 'to', slotType, 'slot', slotIndex);
        } else {
          console.warn('❌ Module not compatible with slot type');
        }
      }
    } catch (error) {
      console.error('❌ Failed to handle module drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleModuleDragStart = (e: React.DragEvent, module: Module) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(module));
    e.currentTarget.classList.add('dragging');
    console.log('🖱️ Started dragging:', module.typeName);
  };

  const handleModuleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  };

  const isModuleCompatibleWithSlot = (module: Module, slotType: string): boolean => {
    // Define slot compatibility based on module groups
    const slotCompatibility: { [key: string]: string[] } = {
      'high': [
        'Projectile Weapon', 'Hybrid Weapon', 'Energy Weapon', 
        'Missile Launcher Light', 'Missile Launcher Heavy', 'Missile Launcher Cruise',
        'Mining Laser', 'Strip Miner', 'Salvager', 'Tractor Beam', 'Smartbomb'
      ],
      'mid': [
        'Shield Extender', 'Shield Booster', 'Shield Hardener', 'Shield Recharger',
        'ECM', 'Sensor Dampener', 'Target Painter', 'Tracking Disruptor', 'Warp Disruptor',
        'Propulsion Module', 'Capacitor Booster', 'Stasis Web', 'Scan Probe Launcher'
      ],
      'low': [
        'Armor Reinforcer', 'Armor Repair Unit', 'Armor Hardener', 'Hull Repair Unit',
        'Damage Control', 'Weapon Upgrade', 'Engineering Rig', 'Capacitor Recharger',
        'Capacitor Power Relay', 'Power Diagnostic System', 'Reactor Control Unit'
      ],
      'rig': [
        'Rig Weapon', 'Rig Shield', 'Rig Armor', 'Rig Engineering', 'Rig Astronautic',
        'Rig Electronics', 'Rig Energy', 'Rig Hybrid', 'Rig Projectile', 'Rig Drones'
      ]
    };

    const compatibleGroups = slotCompatibility[slotType] || [];
    return compatibleGroups.includes(module.groupName);
  };

  // Filter functions
  const filteredShips = ships.filter(ship => {
    const matchesSearch = ship.typeName.toLowerCase().includes(searchShip.toLowerCase());
    const matchesRace = selectedRace === 'all' || ship.raceName?.includes(selectedRace);
    const matchesGroup = selectedShipGroup === 'all' || ship.groupName === selectedShipGroup;
    return matchesSearch && matchesRace && matchesGroup;
  });

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.typeName.toLowerCase().includes(searchModule.toLowerCase());
    const matchesGroup = selectedModuleGroup === 'all' || module.groupName === selectedModuleGroup;
    return matchesSearch && matchesGroup;
  });

  // Get unique values for filters
  const races = Array.from(new Set(ships.map(ship => ship.raceName).filter(Boolean)));
  const shipGroups = Array.from(new Set(ships.map(ship => ship.groupName)));
  const moduleGroups = Array.from(new Set(modules.map(module => module.groupName)));

  const renderShipFittingCanvas = () => {
    if (!selectedShip || !shipStats) {
      return (
        <div className="no-ship-selected">
          <p>Select a ship to begin fitting</p>
        </div>
      );
    }

    const highSlots = fitting.filter(slot => slot.slotType === 'high');
    const midSlots = fitting.filter(slot => slot.slotType === 'mid');
    const lowSlots = fitting.filter(slot => slot.slotType === 'low');
    const rigSlots = fitting.filter(slot => slot.slotType === 'rig');

    return (
      <div className="ship-fitting-canvas">
        {/* High Power Slots */}
        <div className="slot-row high-power-slots">
          {highSlots.map(slot => renderFittingSlot(slot))}
        </div>

        {/* Ship Central Area */}
        <div className="ship-central-area">
          {/* Mid Power Slots - Left Side */}
          <div className="slot-column mid-power-slots left">
            {midSlots.slice(0, Math.ceil(midSlots.length / 2)).map(slot => renderFittingSlot(slot))}
          </div>

          {/* Ship Hull */}
          <div className="ship-hull">
            <div className="ship-silhouette">
              <div className="ship-body">
                <div className="ship-core">
                  <div className="ship-name-display">{selectedShip.typeName}</div>
                  <div className="ship-type-display">{selectedShip.groupName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mid Power Slots - Right Side */}
          <div className="slot-column mid-power-slots right">
            {midSlots.slice(Math.ceil(midSlots.length / 2)).map(slot => renderFittingSlot(slot))}
          </div>
        </div>

        {/* Low Power Slots */}
        <div className="slot-row low-power-slots">
          {lowSlots.map(slot => renderFittingSlot(slot))}
        </div>

        {/* Rig Slots */}
        {rigSlots.length > 0 && (
          <div className="slot-row rig-slots">
            {rigSlots.map(slot => renderFittingSlot(slot))}
          </div>
        )}
      </div>
    );
  };

  const renderFittingSlot = (slot: FittingSlot) => {
    return (
      <div
        key={`${slot.slotType}-${slot.index}`}
        className={`fitting-slot ${slot.slotType}-slot ${slot.moduleTypeID ? 'occupied' : 'empty'}`}
        onDrop={(e) => handleModuleDrop(e, slot.slotType, slot.index)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDoubleClick={() => removeModuleFromSlot(slot.slotType, slot.index)}
        title={slot.moduleTypeID ? slot.moduleName : `Empty ${slot.slotType} slot`}
      >
        {slot.moduleTypeID ? (
          <div className="fitted-module">
            <div className="module-icon"></div>
            <div className={`online-indicator ${slot.online ? 'online' : 'offline'}`}></div>
            <div className="module-tooltip">
              <span className="module-name">{slot.moduleName}</span>
            </div>
          </div>
        ) : (
          <div className="empty-slot-content">
            <div className="slot-icon"></div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ship-fitting">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing ship fitting system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ship-fitting">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={initializeFitting} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ship-fitting">
      <div className="fitting-header">
        <h2>Ship Fitting</h2>
        <div className="fitting-controls">
          <button className="control-btn" onClick={() => setFitting([])}>New Fitting</button>
          <button className="control-btn" onClick={handleSaveFitting}>Save Fitting</button>
          <button className="control-btn" onClick={handleLoadFitting}>Load Fitting</button>
          <button className="control-btn settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙️ Settings</button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Ship Fitting Settings</h3>
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <h4>SDE Version Information</h4>
              <div className="version-info">
                <div className="version-row">
                  <span className="version-label">Latest Available:</span>
                  <span className="version-value">
                    {sdeVersionInfo ? sdeVersionInfo.version : 'Checking...'}
                    {sdeVersionInfo?.lastModified && (
                      <span className="version-date">
                        ({new Date(sdeVersionInfo.lastModified).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                </div>
                <div className="version-row">
                  <span className="version-label">Installed:</span>
                  <span className="version-value">
                    {installedVersionInfo ? installedVersionInfo.version : 'None'}
                    {installedVersionInfo?.lastModified && (
                      <span className="version-date">
                        ({new Date(installedVersionInfo.lastModified).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                </div>
                {sdeVersionInfo && installedVersionInfo && 
                 sdeVersionInfo.etag !== installedVersionInfo.etag && (
                  <div className="version-status update-available">
                    ⚠️ Update Available
                  </div>
                )}
                {installedVersionInfo && sdeVersionInfo && 
                 sdeVersionInfo.etag === installedVersionInfo.etag && (
                  <div className="version-status up-to-date">
                    ✅ Up to Date
                  </div>
                )}
              </div>
            </div>
            
            <div className="setting-item">
              <h4>SDE Data Management</h4>
              <p>Download the complete EVE Online Static Data Export for full ship and module database.</p>
              
              {downloadProgress && (
                <div className="download-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${downloadProgress.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>{downloadProgress.message}</span>
                    <span>{downloadProgress.progress.toFixed(1)}%</span>
                  </div>
                  {downloadProgress.downloadedSize && downloadProgress.totalSize && (
                    <div className="download-size">
                      {(downloadProgress.downloadedSize / 1024 / 1024).toFixed(1)} MB / 
                      {(downloadProgress.totalSize / 1024 / 1024).toFixed(1)} MB
                    </div>
                  )}
                </div>
              )}
              
              <div className="database-controls">
                <button 
                  className="download-btn" 
                  onClick={handleDownloadSDE}
                  disabled={downloadingSDe || parsingSDe || refreshingDatabase || importingSDe}
                >
                  {downloadingSDe ? 'Downloading...' : 'Download Latest SDE'}
                </button>
                <button 
                  className="parse-btn" 
                  onClick={handleParseSDE}
                  disabled={parsingSDe || downloadingSDe || refreshingDatabase || importingSDe}
                >
                  {parsingSDe ? 'Parsing...' : 'Parse SDE Data'}
                </button>
                <button 
                  className="refresh-btn" 
                  onClick={handleRefreshDatabase}
                  disabled={refreshingDatabase || importingSDe || downloadingSDe || parsingSDe}
                >
                  {refreshingDatabase ? 'Refreshing...' : 'Refresh Database'}
                </button>
                <button 
                  className="import-btn" 
                  onClick={handleSDEImport}
                  disabled={importingSDe || refreshingDatabase || downloadingSDe || parsingSDe}
                >
                  {importingSDe ? 'Importing...' : 'Import SDE Data'}
                </button>
              </div>
              <p className="setting-note">Current: {ships.length} ships, {modules.length} modules</p>
              <p className="setting-help">Download the full SDE for access to all EVE Online ships and modules.</p>
            </div>
            
            <div className="setting-item">
              <h4>Data Status</h4>
              <p>Ships loaded: {ships.length}</p>
              <p>Modules loaded: {modules.length}</p>
              <p>SDE Version: {installedVersionInfo?.version || 'Unknown'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Fitting Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3>Save Fitting</h3>
              <button className="close-btn" onClick={() => setShowSaveDialog(false)}>✕</button>
            </div>
            <div className="dialog-content">
              <div className="dialog-info">
                <p>Ship: <strong>{selectedShip?.typeName}</strong></p>
                <p>Modules: <strong>{fitting.filter(slot => slot.moduleTypeID).length}</strong> fitted</p>
              </div>
              <div className="input-group">
                <label htmlFor="fitting-name">Fitting Name:</label>
                <input
                  id="fitting-name"
                  type="text"
                  value={fittingName}
                  onChange={(e) => setFittingName(e.target.value)}
                  placeholder="Enter fitting name..."
                  maxLength={50}
                />
              </div>
              <div className="dialog-actions">
                <button className="cancel-btn" onClick={() => setShowSaveDialog(false)}>Cancel</button>
                <button className="save-btn" onClick={saveFitting}>Save Fitting</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Fitting Dialog */}
      {showLoadDialog && (
        <div className="dialog-overlay">
          <div className="dialog large">
            <div className="dialog-header">
              <h3>Load Fitting</h3>
              <button className="close-btn" onClick={() => setShowLoadDialog(false)}>✕</button>
            </div>
            <div className="dialog-content">
              {savedFittings.length === 0 ? (
                <div className="no-fittings">
                  <p>No saved fittings found.</p>
                  <p>Save some fittings first to see them here.</p>
                </div>
              ) : (
                <div className="fittings-list">
                  {savedFittings.map((fitting, index) => (
                    <div key={index} className="fitting-item">
                      <div className="fitting-info">
                        <div className="fitting-name">{fitting.fittingName}</div>
                        <div className="fitting-details">
                          <span className="ship-name">{fitting.shipName}</span>
                          <span className="module-count">{fitting.slots.filter((slot: any) => slot.moduleTypeID).length} modules</span>
                          <span className="save-date">{new Date(fitting.created).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="fitting-actions">
                        <button className="load-btn" onClick={() => loadFitting(fitting)}>Load</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="dialog-actions">
                <button className="cancel-btn" onClick={() => setShowLoadDialog(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fitting-layout">
        {/* Ship Browser */}
        <div className="ship-browser">
          <div className="browser-tabs">
            <div className="tab active">Ships</div>
          </div>
          <div className="browser-filters">
            <input
              type="text"
              placeholder="Search ships..."
              value={searchShip}
              onChange={(e) => setSearchShip(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Races</option>
              {races.map(race => (
                <option key={race} value={race}>{race}</option>
              ))}
            </select>
            <select
              value={selectedShipGroup}
              onChange={(e) => setSelectedShipGroup(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {shipGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="ship-list">
            {filteredShips.length > 0 ? (
              filteredShips.map(ship => (
                <div
                  key={ship.typeID}
                  className={`ship-item ${selectedShip?.typeID === ship.typeID ? 'selected' : ''}`}
                  onClick={() => setSelectedShip(ship)}
                  title={`${ship.typeName} - ${ship.raceName} ${ship.groupName}`}
                >
                  <div className="ship-name">{ship.typeName}</div>
                  <div className="ship-info">
                    <span className="ship-race">{ship.raceName}</span>
                    <span className="ship-type">{ship.groupName}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                {ships.length === 0 ? (
                  <>
                    <p>📦 No ship data available</p>
                    <p>Run SDE import to load ships:</p>
                    <code>await window.electronAPI.sde.import()</code>
                  </>
                ) : (
                  <p>No ships match current filters</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fitting Canvas */}
        <div className="fitting-canvas">
          {selectedShip ? (
            <>
              <div className="ship-info-header">
                <h3>{selectedShip.typeName}</h3>
                <div className="ship-details">
                  <span>{selectedShip.raceName} {selectedShip.groupName}</span>
                </div>
              </div>

              <div className="fitting-display">
                {renderShipFittingCanvas()}
              </div>

              {fittingStats && (
                <div className="fitting-stats">
                  <div className="stats-grid">
                    <div className="stat-group combat-stats">
                      <h4>Combat</h4>
                      <div className="stat-item">
                        <span className="stat-label">DPS:</span>
                        <span className="stat-value dps-value">{fittingStats.dps.toFixed(1)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">EHP:</span>
                        <span className="stat-value">{fittingStats.ehp.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="stat-group fitting-stats-group">
                      <h4>Fitting</h4>
                      <div className="stat-item">
                        <span className="stat-label">CPU:</span>
                        <span className={`stat-value ${fittingStats.cpu.percentage > 100 ? 'overload' : fittingStats.cpu.percentage > 95 ? 'warning' : ''}`}>
                          {fittingStats.cpu.used.toFixed(0)}/{fittingStats.cpu.total} tf
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">PowerGrid:</span>
                        <span className={`stat-value ${fittingStats.powergrid.percentage > 100 ? 'overload' : fittingStats.powergrid.percentage > 95 ? 'warning' : ''}`}>
                          {fittingStats.powergrid.used.toFixed(0)}/{fittingStats.powergrid.total} MW
                        </span>
                      </div>
                    </div>
                    
                    <div className="stat-group tank-stats">
                      <h4>Tank</h4>
                      <div className="stat-item">
                        <span className="stat-label">Shield:</span>
                        <span className="stat-value shield-value">{fittingStats.ehp.shield.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Armor:</span>
                        <span className="stat-value armor-value">{fittingStats.ehp.armor.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Hull:</span>
                        <span className="stat-value hull-value">{fittingStats.ehp.hull.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-ship-selected">
              <p>Select a ship to begin fitting</p>
            </div>
          )}
        </div>

        {/* Module Browser */}
        <div className="module-browser">
          <div className="browser-tabs">
            <div className="tab active">Modules</div>
          </div>
          <div className="browser-filters">
            <input
              type="text"
              placeholder="Search modules..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedModuleGroup}
              onChange={(e) => setSelectedModuleGroup(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {moduleGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="module-list">
            {filteredModules.length > 0 ? (
              filteredModules.slice(0, 100).map(module => (
                <div
                  key={module.typeID}
                  className="module-item"
                  draggable
                  onDragStart={(e) => handleModuleDragStart(e, module)}
                  onDragEnd={handleModuleDragEnd}
                  onDoubleClick={() => handleModuleDoubleClick(module)}
                  title={`Double-click to add ${module.typeName} to fitting`}
                >
                  <div className="module-name">{module.typeName}</div>
                  <div className="module-info">
                    <span className="module-group">{module.groupName}</span>
                    <span className="module-meta">T{module.techLevel}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                {modules.length === 0 ? (
                  <>
                    <p>⚙️ No module data available</p>
                    <p>Run SDE import to load modules:</p>
                    <code>await window.electronAPI.sde.import()</code>
                  </>
                ) : (
                  <p>No modules match current filters</p>
                )}
              </div>
            )}
            {filteredModules.length > 100 && (
              <div className="showing-limited">
                Showing first 100 of {filteredModules.length} modules
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipFitting;