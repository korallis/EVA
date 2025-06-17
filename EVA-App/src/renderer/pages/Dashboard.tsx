import React, { useContext, useEffect, useState } from 'react';
import { CharacterContext } from '../App';
import CircularProgress from '../components/CircularProgress';
import './Dashboard.css';

interface CharacterOverviewData {
  // Character Basic Info
  characterAge: string;
  totalSP: number;
  securityStatus: number;
  
  // Current Status
  currentShip: {
    name: string;
    type: string;
    typeId: number;
  } | null;
  currentLocation: {
    systemName: string;
    stationName?: string;
    securityLevel: number;
  } | null;
  isOnline: boolean;
  
  // Corporation Info
  corporation: {
    name: string;
    ticker: string;
    memberCount: number;
    joinDate: string;
    timeInCorp: string;
  } | null;
  
  // Wallet & Assets
  walletBalance: number;
  
  // Training Info
  currentTraining: {
    skillName: string;
    finishDate: string;
    timeRemaining: string;
    level: number;
  } | null;
  
  // Enhanced Clone Info
  homeClone: {
    locationName: string;
    locationType: string;
  } | null;
  jumpClones: Array<{
    cloneId: number;
    locationName: string;
    implantNames: string[];
    name?: string;
  }>;
  lastCloneJump: string | null;
  jumpFatigueExpiry: string | null;
  
  // Enhanced Implants
  implants: Array<{
    typeId: number;
    name: string;
    slot?: number;
    timeRemaining?: string;
    isTemporary?: boolean;
  }>;
  
  // Blueprints
  blueprints: {
    total: number;
    bpos: number;
    bpcs: number;
    recentBlueprints: Array<{
      name: string;
      isOriginal: boolean;
      materialEfficiency: number;
      timeEfficiency: number;
      runs?: number;
      locationName?: string;
    }>;
    researchProgress: {
      totalME: number;
      totalTE: number;
      averageME: number;
      averageTE: number;
    };
  };
}

interface SDEStatistics {
  version: string;
  lastUpdated: string;
  totalShips: number;
  totalModules: number;
  totalItems: number;
  shipsByRace: Record<string, number>;
  modulesByCategory: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [overviewData, setOverviewData] = useState<CharacterOverviewData>({
    characterAge: '',
    totalSP: 0,
    securityStatus: 0,
    currentShip: null,
    currentLocation: null,
    isOnline: false,
    corporation: null,
    walletBalance: 0,
    currentTraining: null,
    homeClone: null,
    jumpClones: [],
    lastCloneJump: null,
    jumpFatigueExpiry: null,
    implants: [],
    blueprints: {
      total: 0,
      bpos: 0,
      bpcs: 0,
      recentBlueprints: [],
      researchProgress: {
        totalME: 0,
        totalTE: 0,
        averageME: 0,
        averageTE: 0
      }
    },
  });
  const [sdeStats, setSdeStats] = useState<SDEStatistics | null>(null);
  const [implantNames, setImplantNames] = useState<Record<number, string>>({});
  const [blueprintNames, setBlueprintNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [sdeLoading, setSdeLoading] = useState(true);

  useEffect(() => {
    // Always load SDE statistics
    loadSDEStatistics();
    
    if (isAuthenticated && activeCharacter) {
      loadCharacterOverview();
    } else {
      setLoading(false);
    }
  }, [activeCharacter, isAuthenticated]);
  
  const loadSDEStatistics = async () => {
    try {
      setSdeLoading(true);
      const stats = await window.electronAPI.sde.getStatistics();
      setSdeStats(stats);
    } catch (error) {
      console.error('Failed to load SDE statistics:', error);
      // Fallback stats
      setSdeStats({
        version: 'Unknown',
        lastUpdated: 'Unknown',
        totalShips: 0,
        totalModules: 0,
        totalItems: 0,
        shipsByRace: {},
        modulesByCategory: {}
      });
    } finally {
      setSdeLoading(false);
    }
  };

  const loadCharacterOverview = async () => {
    try {
      setLoading(true);
      
      const characterId = activeCharacter?.character_id?.toString();
      if (!characterId) {
        throw new Error('No character ID available');
      }

      // Fetch all character data in parallel
      const esiAPI = (window.electronAPI.esi as any);
      const [
        skills,
        skillQueue,
        location,
        ship,
        wallet,
        corporationHistory,
        enhancedClones,
        implants,
        blueprints
      ] = await Promise.allSettled([
        esiAPI.getCharacterSkills(characterId),
        esiAPI.getCharacterSkillQueue(characterId),
        esiAPI.getCharacterLocation(characterId),
        esiAPI.getCharacterShip(characterId),
        esiAPI.getCharacterWallet(characterId),
        esiAPI.getCharacterCorporationHistory(characterId),
        esiAPI.getEnhancedCharacterClones(characterId),
        esiAPI.getCharacterImplants(characterId),
        esiAPI.getCharacterBlueprints(characterId)
      ]);

      // Process skills data
      const totalSP = skills.status === 'fulfilled' ? 
        skills.value.total_sp || skills.value.skills?.reduce((sum: number, skill: any) => 
          sum + (skill.skillpoints_in_skill || 0), 0) || 0 : 0;
      
      // Process current training
      let currentTraining = null;
      if (skillQueue.status === 'fulfilled' && skillQueue.value.length > 0) {
        const activeSkill = skillQueue.value[0];
        if (activeSkill.finish_date) {
          const finishDate = new Date(activeSkill.finish_date);
          const now = new Date();
          const timeRemaining = finishDate.getTime() - now.getTime();
          
          if (timeRemaining > 0) {
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            currentTraining = {
              skillName: `Skill ${activeSkill.skill_id}`, // Will need to resolve skill name
              finishDate: finishDate.toLocaleString(),
              timeRemaining: `${days}d ${hours}h ${minutes}m`,
              level: activeSkill.finished_level
            };
          }
        }
      }

      // Process location data
      let currentLocation = null;
      let systemInfo = null;
      if (location.status === 'fulfilled') {
        try {
          systemInfo = await esiAPI.getSystemInfo(location.value.solar_system_id);
          currentLocation = {
            systemName: systemInfo.name || `System ${location.value.solar_system_id}`,
            stationName: location.value.station_id ? `Station ${location.value.station_id}` : undefined,
            securityLevel: systemInfo.security_status || 0
          };
        } catch (error) {
          console.warn('Failed to fetch system info:', error);
          currentLocation = {
            systemName: `System ${location.value.solar_system_id}`,
            securityLevel: 0
          };
        }
      }

      // Process ship data
      let currentShip = null;
      if (ship.status === 'fulfilled') {
        // Will need to resolve ship type name from SDE
        currentShip = {
          name: ship.value.ship_name || 'Unknown Ship',
          type: `Type ${ship.value.ship_type_id}`,
          typeId: ship.value.ship_type_id
        };
      }

      // Process corporation data
      let corporation = null;
      if (corporationHistory.status === 'fulfilled' && corporationHistory.value.length > 0) {
        const currentCorp = corporationHistory.value[0]; // Most recent entry
        const joinDate = new Date(currentCorp.start_date);
        const now = new Date();
        const timeInCorp = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        try {
          const corpInfo = await esiAPI.getCorporationInfo(currentCorp.corporation_id);
          corporation = {
            name: corpInfo.name,
            ticker: corpInfo.ticker,
            memberCount: corpInfo.member_count,
            joinDate: joinDate.toLocaleDateString(),
            timeInCorp: `${timeInCorp} days`
          };
        } catch (error) {
          console.warn('Failed to fetch corporation info:', error);
          corporation = {
            name: `Corporation ${currentCorp.corporation_id}`,
            ticker: 'UNKN',
            memberCount: 0,
            joinDate: joinDate.toLocaleDateString(),
            timeInCorp: `${timeInCorp} days`
          };
        }
      }

      // Process enhanced clone data
      let homeClone = null;
      let jumpClones: any[] = [];
      let lastCloneJump = null;
      let jumpFatigueExpiry = null;
      
      if (enhancedClones.status === 'fulfilled') {
        const cloneData = enhancedClones.value;
        
        if (cloneData.home_location) {
          homeClone = {
            locationName: cloneData.home_location.location_name || `Location ${cloneData.home_location.location_id}`,
            locationType: cloneData.home_location.location_type
          };
        }
        
        jumpClones = cloneData.jump_clones?.map((clone: any) => ({
          cloneId: clone.clone_id,
          locationName: clone.location_name || `Location ${clone.location_id}`,
          implantNames: clone.implant_names || [],
          name: clone.name
        })) || [];
        
        lastCloneJump = cloneData.last_clone_jump_date || null;
        jumpFatigueExpiry = cloneData.jump_fatigue_expire_date || null;
      }

      // Calculate character age (mock for now)
      const characterAge = activeCharacter?.character_name ? 
        `${Math.floor(Math.random() * 10) + 1} years` : 'Unknown';

      // Process enhanced implants data
      let enhancedImplants: any[] = [];
      if (implants.status === 'fulfilled') {
        const implantData = implants.value;
        const implantIds = implantData.map((imp: any) => imp.type_id);
        
        // Resolve implant names
        let resolvedImplantNames: Record<number, string> = {};
        if (implantIds.length > 0) {
          try {
            resolvedImplantNames = await window.electronAPI.sde.getImplantNames(implantIds);
            setImplantNames(resolvedImplantNames);
          } catch (error) {
            console.warn('Failed to resolve implant names:', error);
          }
        }
        
        enhancedImplants = implantData.map((implant: any) => ({
          typeId: implant.type_id,
          name: resolvedImplantNames[implant.type_id] || implant.name || `Implant ${implant.type_id}`,
          slot: implant.slot,
          // Note: ESI doesn't provide expiration data for implants currently
          // Temporary implants/boosters would need separate endpoint
          timeRemaining: undefined as string | undefined,
          isTemporary: false
        }));
      }
      
      // Process blueprint data
      let blueprintData = {
        total: 0,
        bpos: 0,
        bpcs: 0,
        recentBlueprints: [] as any[],
        researchProgress: {
          totalME: 0,
          totalTE: 0,
          averageME: 0,
          averageTE: 0
        }
      };
      
      if (blueprints.status === 'fulfilled') {
        const bpData = blueprints.value;
        const bpTypeIds = bpData.map((bp: any) => bp.type_id);
        
        // Resolve blueprint names
        let resolvedBlueprintNames: Record<number, string> = {};
        if (bpTypeIds.length > 0) {
          try {
            resolvedBlueprintNames = await window.electronAPI.sde.getBlueprintNames(bpTypeIds);
            setBlueprintNames(resolvedBlueprintNames);
          } catch (error) {
            console.warn('Failed to resolve blueprint names:', error);
          }
        }
        
        const bpos = bpData.filter((bp: any) => !bp.is_copy);
        const bpcs = bpData.filter((bp: any) => bp.is_copy);
        
        blueprintData = {
          total: bpData.length,
          bpos: bpos.length,
          bpcs: bpcs.length,
          recentBlueprints: bpData.slice(0, 5).map((bp: any) => ({
            name: resolvedBlueprintNames[bp.type_id] || bp.type_name || `Blueprint ${bp.type_id}`,
            isOriginal: !bp.is_copy,
            materialEfficiency: bp.material_efficiency,
            timeEfficiency: bp.time_efficiency,
            runs: bp.runs,
            locationName: `Location ${bp.location_id}`
          })),
          researchProgress: {
            totalME: bpos.reduce((sum: number, bp: any) => sum + bp.material_efficiency, 0),
            totalTE: bpos.reduce((sum: number, bp: any) => sum + bp.time_efficiency, 0),
            averageME: bpos.length > 0 ? Math.round(bpos.reduce((sum: number, bp: any) => sum + bp.material_efficiency, 0) / bpos.length) : 0,
            averageTE: bpos.length > 0 ? Math.round(bpos.reduce((sum: number, bp: any) => sum + bp.time_efficiency, 0) / bpos.length) : 0
          }
        };
      }
      
      setOverviewData({
        characterAge,
        totalSP,
        securityStatus: -0.1 + Math.random() * 10.1, // Mock security status
        currentShip,
        currentLocation,
        isOnline: true, // Assume online if we can fetch data
        corporation,
        walletBalance: wallet.status === 'fulfilled' ? wallet.value : 0,
        currentTraining,
        homeClone,
        jumpClones,
        lastCloneJump,
        jumpFatigueExpiry,
        implants: enhancedImplants,
        blueprints: blueprintData
      });
    } catch (error) {
      console.error('Failed to load character overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="auth-prompt glass-panel">
          <h2 className="text-h1">Welcome to EVA</h2>
          <p className="text-body">
            Connect your EVE Online character to access your personalized dashboard.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.electronAPI.auth.start()}
          >
            Connect to EVE Online
          </button>
        </div>
        
        {/* SDE Statistics Section */}
        <div className="sde-stats-section">
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">EVE Database Status</h3>
            {sdeLoading ? (
              <div className="loading-container">
                <CircularProgress 
                  value={50} 
                  size={60} 
                  color="var(--primary-cyan)"
                  label="Loading Database Stats..."
                />
              </div>
            ) : sdeStats ? (
              <div className="sde-stats-grid">
                <div className="stat-group">
                  <h4 className="text-h3">Database Info</h4>
                  <div className="stat-item">
                    <span className="stat-label text-small">SDE Version</span>
                    <span className="stat-value text-body">{sdeStats.version}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label text-small">Last Updated</span>
                    <span className="stat-value text-body">{sdeStats.lastUpdated}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label text-small">Total Items</span>
                    <span className="stat-value text-h3">{sdeStats.totalItems.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="stat-group">
                  <h4 className="text-h3">Ships by Race</h4>
                  {Object.entries(sdeStats.shipsByRace).map(([race, count]) => (
                    <div key={race} className="stat-item">
                      <span className="stat-label text-small">{race}</span>
                      <span className="stat-value text-body">{count}</span>
                    </div>
                  ))}
                  <div className="stat-item">
                    <span className="stat-label text-small total-label">Total Ships</span>
                    <span className="stat-value text-h3 total-value">{sdeStats.totalShips}</span>
                  </div>
                </div>
                
                <div className="stat-group">
                  <h4 className="text-h3">Modules & Equipment</h4>
                  {Object.entries(sdeStats.modulesByCategory).map(([category, count]) => (
                    <div key={category} className="stat-item">
                      <span className="stat-label text-small">{category}</span>
                      <span className="stat-value text-body">{count}</span>
                    </div>
                  ))}
                  <div className="stat-item">
                    <span className="stat-label text-small total-label">Total Modules</span>
                    <span className="stat-value text-h3 total-value">{sdeStats.totalModules}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data text-body">Unable to load database statistics</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <CircularProgress 
            value={75} 
            size={80} 
            color="var(--primary-cyan)"
            label="Loading Character Overview..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="character-overview">
        <div className="overview-header">
          <div className="character-title">
            <h1 className="text-hero">{activeCharacter?.character_name}</h1>
            <div className="character-badges">
              <span className={`status-badge ${overviewData.isOnline ? 'online' : 'offline'}`}>
                {overviewData.isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
              <span className="age-badge">{overviewData.characterAge}</span>
            </div>
          </div>
          <div className="overview-stats">
            <div className="stat-item">
              <span className="stat-value text-h2">{(overviewData.totalSP / 1000000).toFixed(1)}M</span>
              <span className="stat-label text-small">Total SP</span>
            </div>
            <div className="stat-item">
              <span className={`stat-value text-h2 ${overviewData.securityStatus >= 0 ? 'positive' : 'negative'}`}>
                {overviewData.securityStatus.toFixed(2)}
              </span>
              <span className="stat-label text-small">Security Status</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-h2">{overviewData.walletBalance.toLocaleString()}</span>
              <span className="stat-label text-small">ISK</span>
            </div>
            <div className="stat-item">
              <button 
                className="btn btn-ghost btn-small logout-btn"
                onClick={async () => {
                  try {
                    await window.electronAPI.auth.logout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                title="Logout and re-authenticate"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        <div className="overview-grid">
          {/* Current Status Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Current Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label text-small">Current Ship</span>
                <span className="status-value text-body">
                  {overviewData.currentShip ? 
                    `${overviewData.currentShip.name} (${overviewData.currentShip.type})` : 
                    'Unknown Ship'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label text-small">Location</span>
                <span className="status-value text-body">
                  {overviewData.currentLocation ? (
                    <>
                      {overviewData.currentLocation.systemName}
                      {overviewData.currentLocation.stationName && (
                        <><br /><span className="text-small">{overviewData.currentLocation.stationName}</span></>
                      )}
                      <span className={`sec-status ${overviewData.currentLocation.securityLevel >= 0.5 ? 'high' : 
                        overviewData.currentLocation.securityLevel > 0 ? 'low' : 'null'}`}>
                        ({overviewData.currentLocation.securityLevel.toFixed(1)})
                      </span>
                    </>
                  ) : 'Unknown Location'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label text-small">Home Clone</span>
                <span className="status-value text-body">
                  {overviewData.homeClone ? 
                    `${overviewData.homeClone.locationName} (${overviewData.homeClone.locationType})` : 
                    'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Corporation Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Corporation</h3>
            {overviewData.corporation ? (
              <div className="corp-info">
                <div className="corp-header">
                  <span className="corp-name text-body">{overviewData.corporation.name}</span>
                  <span className="corp-ticker text-small">[{overviewData.corporation.ticker}]</span>
                </div>
                <div className="corp-stats">
                  <div className="corp-stat">
                    <span className="stat-label text-small">Member Count</span>
                    <span className="stat-value text-body">{overviewData.corporation.memberCount.toLocaleString()}</span>
                  </div>
                  <div className="corp-stat">
                    <span className="stat-label text-small">Joined</span>
                    <span className="stat-value text-body">{overviewData.corporation.joinDate}</span>
                  </div>
                  <div className="corp-stat">
                    <span className="stat-label text-small">Time in Corp</span>
                    <span className="stat-value text-body">{overviewData.corporation.timeInCorp}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data text-body">No corporation data available</div>
            )}
          </div>

          {/* Training Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Current Training</h3>
            {overviewData.currentTraining ? (
              <div className="training-info">
                <div className="training-skill">
                  <span className="skill-name text-body">{overviewData.currentTraining.skillName}</span>
                  <span className="skill-level text-small">Level {overviewData.currentTraining.level}</span>
                </div>
                <div className="training-time">
                  <span className="time-remaining text-h3">{overviewData.currentTraining.timeRemaining}</span>
                  <span className="finish-date text-small">Completes: {overviewData.currentTraining.finishDate}</span>
                </div>
              </div>
            ) : (
              <div className="no-training text-body">
                <span>No active training</span>
                <button className="btn btn-secondary btn-small">Start Training</button>
              </div>
            )}
          </div>

          {/* Enhanced Implants Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Implants & Augmentations</h3>
            <div className="implants-grid">
              {overviewData.implants.length > 0 ? (
                overviewData.implants.map((implant, index) => (
                  <div key={implant.typeId} className={`implant-slot ${implant.isTemporary ? 'temporary' : ''}`}>
                    <span className="implant-name text-small">
                      {implant.name}
                      {implant.slot && <div className="implant-slot-number">Slot {implant.slot}</div>}
                    </span>
                    {implant.timeRemaining && (
                      <div className="implant-timer text-tiny">
                        {implant.timeRemaining}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-implants text-body">No implants installed</div>
              )}
            </div>
          </div>
          
          {/* Enhanced Clone Management Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Clone Management</h3>
            <div className="clone-info">
              <div className="clone-section">
                <h4 className="text-h3 clone-section-title">Home Clone</h4>
                <div className="clone-location">
                  <span className="location-name text-body">
                    {overviewData.homeClone?.locationName || 'Unknown Location'}
                  </span>
                  <span className="location-type text-small">
                    ({overviewData.homeClone?.locationType || 'Unknown'})
                  </span>
                </div>
              </div>
              
              {overviewData.jumpClones.length > 0 && (
                <div className="clone-section">
                  <h4 className="text-h3 clone-section-title">Jump Clones ({overviewData.jumpClones.length})</h4>
                  <div className="jump-clones-list">
                    {overviewData.jumpClones.map((clone, index) => (
                      <div key={clone.cloneId} className="jump-clone-item">
                        <div className="clone-header">
                          <span className="clone-name text-body">
                            {clone.name || `Clone ${index + 1}`}
                          </span>
                          <span className="clone-location text-small">
                            {clone.locationName}
                          </span>
                        </div>
                        {clone.implantNames.length > 0 && (
                          <div className="clone-implants">
                            <span className="implants-label text-tiny">Implants: </span>
                            <span className="implants-list text-tiny">
                              {clone.implantNames.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {overviewData.lastCloneJump && (
                <div className="clone-section">
                  <div className="clone-stat">
                    <span className="stat-label text-small">Last Clone Jump</span>
                    <span className="stat-value text-body">
                      {new Date(overviewData.lastCloneJump).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              {overviewData.jumpFatigueExpiry && new Date(overviewData.jumpFatigueExpiry) > new Date() && (
                <div className="clone-section">
                  <div className="clone-stat fatigue-warning">
                    <span className="stat-label text-small">Jump Fatigue</span>
                    <span className="stat-value text-body warning">
                      Expires: {new Date(overviewData.jumpFatigueExpiry).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Blueprints Panel */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">Blueprint Library</h3>
            <div className="blueprint-info">
              <div className="blueprint-summary">
                <div className="blueprint-counts">
                  <div className="count-item">
                    <span className="count-value text-h3">{overviewData.blueprints.total}</span>
                    <span className="count-label text-small">Total</span>
                  </div>
                  <div className="count-item bpo">
                    <span className="count-value text-h3">{overviewData.blueprints.bpos}</span>
                    <span className="count-label text-small">BPOs</span>
                  </div>
                  <div className="count-item bpc">
                    <span className="count-value text-h3">{overviewData.blueprints.bpcs}</span>
                    <span className="count-label text-small">BPCs</span>
                  </div>
                </div>
                
                {overviewData.blueprints.bpos > 0 && (
                  <div className="research-progress">
                    <div className="progress-item">
                      <span className="progress-label text-small">Avg Material Efficiency</span>
                      <span className="progress-value text-body">{overviewData.blueprints.researchProgress.averageME}%</span>
                    </div>
                    <div className="progress-item">
                      <span className="progress-label text-small">Avg Time Efficiency</span>
                      <span className="progress-value text-body">{overviewData.blueprints.researchProgress.averageTE}%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {overviewData.blueprints.recentBlueprints.length > 0 && (
                <div className="recent-blueprints">
                  <h4 className="text-h3 section-title">Recent Blueprints</h4>
                  <div className="blueprints-list">
                    {overviewData.blueprints.recentBlueprints.map((bp, index) => (
                      <div key={index} className="blueprint-item">
                        <div className="blueprint-header">
                          <span className={`blueprint-name text-body ${bp.isOriginal ? 'bpo' : 'bpc'}`}>
                            {bp.name}
                          </span>
                          <span className="blueprint-type text-tiny">
                            {bp.isOriginal ? 'BPO' : 'BPC'}
                          </span>
                        </div>
                        <div className="blueprint-stats">
                          <span className="me-stat text-tiny">ME: {bp.materialEfficiency}%</span>
                          <span className="te-stat text-tiny">TE: {bp.timeEfficiency}%</span>
                          {bp.runs && (
                            <span className="runs-stat text-tiny">Runs: {bp.runs}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {overviewData.blueprints.total === 0 && (
                <div className="no-blueprints text-body">
                  No blueprints found in accessible locations
                </div>
              )}
            </div>
          </div>
          
          {/* SDE Statistics Panel for Logged-in Users */}
          <div className="overview-panel glass-panel">
            <h3 className="text-h2 panel-title">EVE Database Status</h3>
            {sdeLoading ? (
              <div className="loading-container">
                <CircularProgress 
                  value={50} 
                  size={40} 
                  color="var(--primary-cyan)"
                  label="Loading Database Stats..."
                />
              </div>
            ) : sdeStats ? (
              <div className="sde-stats-compact">
                <div className="sde-summary">
                  <div className="summary-item">
                    <span className="summary-label text-small">SDE Version</span>
                    <span className="summary-value text-body">{sdeStats.version}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label text-small">Ships Available</span>
                    <span className="summary-value text-h3">{sdeStats.totalShips}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label text-small">Modules Available</span>
                    <span className="summary-value text-h3">{sdeStats.totalModules}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label text-small">Total Items</span>
                    <span className="summary-value text-h3">{sdeStats.totalItems.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label text-small">Blueprints</span>
                    <span className="summary-value text-h3">{overviewData.blueprints.total}</span>
                  </div>
                </div>
                <div className="race-breakdown">
                  <span className="breakdown-title text-small">Ships by Race:</span>
                  <div className="race-counts">
                    {Object.entries(sdeStats.shipsByRace).map(([race, count]) => (
                      <span key={race} className="race-count text-small">
                        {race}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data text-body">Unable to load database statistics</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;