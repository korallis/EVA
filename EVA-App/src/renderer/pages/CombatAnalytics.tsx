import React, { useState, useEffect, useContext } from 'react';
import { CharacterContext } from '../App';

interface KillmailShort {
  killmail_id: number;
  killmail_hash: string;
}

interface KillmailDetails {
  killmail_id: number;
  killmail_time: string;
  victim: {
    character_id?: number;
    corporation_id: number;
    alliance_id?: number;
    ship_type_id: number;
    damage_taken: number;
    position?: {
      x: number;
      y: number;
      z: number;
    };
  };
  attackers: Array<{
    character_id?: number;
    corporation_id?: number;
    alliance_id?: number;
    ship_type_id?: number;
    weapon_type_id?: number;
    damage_done: number;
    final_blow: boolean;
    security_status?: number;
  }>;
  solar_system_id: number;
}

interface CombatMetrics {
  totalKills: number;
  totalDeaths: number;
  killDeathRatio: number;
  iskDestroyed: number;
  iskLost: number;
  efficiencyRatio: number;
  soloKills: number;
  assistKills: number;
  topVictimShips: Array<{
    shipTypeId: number;
    shipName: string;
    count: number;
    totalValue: number;
  }>;
  topLossShips: Array<{
    shipTypeId: number;
    shipName: string;
    count: number;
    totalValue: number;
  }>;
  recentActivity: Array<{
    type: 'kill' | 'death';
    killmailId: number;
    date: string;
    shipName: string;
    systemName: string;
    value: number;
    involvedCount: number;
  }>;
}

const CombatAnalytics: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [killmails, setKillmails] = useState<KillmailShort[]>([]);
  const [killmailDetails, setKillmailDetails] = useState<KillmailDetails[]>([]);
  const [metrics, setMetrics] = useState<CombatMetrics>({
    totalKills: 0,
    totalDeaths: 0,
    killDeathRatio: 0,
    iskDestroyed: 0,
    iskLost: 0,
    efficiencyRatio: 0,
    soloKills: 0,
    assistKills: 0,
    topVictimShips: [],
    topLossShips: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'kills' | 'losses' | 'activity'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && activeCharacter) {
      loadCombatData();
    } else {
      setLoading(false);
    }
  }, [activeCharacter, isAuthenticated]);

  const loadCombatData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading combat data...');

      // Fetch recent killmails (first 2 pages for better performance)
      const [page1Result, page2Result] = await Promise.allSettled([
        window.electronAPI.esi.getCharacterKillmails(undefined, 1),
        window.electronAPI.esi.getCharacterKillmails(undefined, 2)
      ]);

      const allKillmails: KillmailShort[] = [];
      if (page1Result.status === 'fulfilled') allKillmails.push(...page1Result.value);
      if (page2Result.status === 'fulfilled') allKillmails.push(...page2Result.value);

      setKillmails(allKillmails);

      // Fetch details for the most recent killmails (limit to 20 for performance)
      const recentKillmails = allKillmails.slice(0, 20);
      const detailsPromises = recentKillmails.map(km => 
        window.electronAPI.esi.getKillmailDetails(km.killmail_id, km.killmail_hash)
      );

      const detailsResults = await Promise.allSettled(detailsPromises);
      const details: KillmailDetails[] = [];
      
      detailsResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          details.push(result.value);
        }
      });

      setKillmailDetails(details);

      // Calculate combat metrics
      calculateCombatMetrics(details);

    } catch (error: any) {
      console.error('Failed to load combat data:', error);
      setError('Failed to load combat data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCombatMetrics = (details: KillmailDetails[]) => {
    if (!activeCharacter) return;

    let totalKills = 0;
    let totalDeaths = 0;
    let iskDestroyed = 0;
    let iskLost = 0;
    let soloKills = 0;
    let assistKills = 0;

    const victimShipCounts = new Map<number, { name: string; count: number; value: number }>();
    const lossShipCounts = new Map<number, { name: string; count: number; value: number }>();
    const recentActivity: Array<{
      type: 'kill' | 'death';
      killmailId: number;
      date: string;
      shipName: string;
      systemName: string;
      value: number;
      involvedCount: number;
    }> = [];

    details.forEach(km => {
      const isVictim = km.victim.character_id === activeCharacter.character_id;
      const estimatedValue = km.victim.damage_taken * 1000; // Simplified value calculation
      const attackerCount = km.attackers.length;
      const shipName = `Ship ${km.victim.ship_type_id}`;
      const systemName = `System ${km.solar_system_id}`;

      // Add to recent activity
      recentActivity.push({
        type: isVictim ? 'death' : 'kill',
        killmailId: km.killmail_id,
        date: km.killmail_time,
        shipName,
        systemName,
        value: estimatedValue,
        involvedCount: attackerCount
      });

      if (isVictim) {
        // This character was killed
        totalDeaths++;
        iskLost += estimatedValue;

        // Track loss ships
        const existing = lossShipCounts.get(km.victim.ship_type_id) || 
          { name: shipName, count: 0, value: 0 };
        existing.count++;
        existing.value += estimatedValue;
        lossShipCounts.set(km.victim.ship_type_id, existing);
      } else {
        // This character participated in a kill
        const isOnKillmail = km.attackers.some(attacker => 
          attacker.character_id === activeCharacter.character_id
        );

        if (isOnKillmail) {
          totalKills++;
          iskDestroyed += estimatedValue;

          if (attackerCount === 1) {
            soloKills++;
          } else {
            assistKills++;
          }

          // Track victim ships
          const existing = victimShipCounts.get(km.victim.ship_type_id) || 
            { name: shipName, count: 0, value: 0 };
          existing.count++;
          existing.value += estimatedValue;
          victimShipCounts.set(km.victim.ship_type_id, existing);
        }
      }
    });

    // Calculate ratios
    const killDeathRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
    const efficiencyRatio = (iskLost + iskDestroyed) > 0 ? 
      (iskDestroyed / (iskLost + iskDestroyed)) * 100 : 0;

    // Sort and limit top ships
    const topVictimShips = Array.from(victimShipCounts.entries())
      .map(([typeId, data]) => ({ shipTypeId: typeId, shipName: data.name, count: data.count, totalValue: data.value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topLossShips = Array.from(lossShipCounts.entries())
      .map(([typeId, data]) => ({ shipTypeId: typeId, shipName: data.name, count: data.count, totalValue: data.value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort recent activity by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setMetrics({
      totalKills,
      totalDeaths,
      killDeathRatio,
      iskDestroyed,
      iskLost,
      efficiencyRatio,
      soloKills,
      assistKills,
      topVictimShips,
      topLossShips,
      recentActivity: recentActivity.slice(0, 10)
    });
  };

  const formatISK = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B ISK`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ISK`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ISK`;
    }
    return `${Math.round(amount).toLocaleString()} ISK`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatKDRatio = (ratio: number): string => {
    if (ratio === Infinity || isNaN(ratio)) return '∞';
    return ratio.toFixed(2);
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Combat & PvP Analytics</h1>
          <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
            Comprehensive combat performance tracking and killmail analysis
          </p>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <button 
              className="btn btn-primary"
              onClick={() => window.electronAPI.auth.start()}
            >
              Connect to EVE Online
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Combat & PvP Analytics</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading combat data and analyzing killmails...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Combat & PvP Analytics</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadCombatData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        {/* Header */}
        <div className="combat-analytics-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Combat & PvP Analytics</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Combat performance analysis for {activeCharacter?.character_name}
          </p>

          {/* Tab Navigation */}
          <div className="tab-navigation" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'overview', name: 'Overview', icon: '⚔️' },
              { id: 'kills', name: 'Kill Analysis', icon: '💀' },
              { id: 'losses', name: 'Loss Analysis', icon: '💥' },
              { id: 'activity', name: 'Recent Activity', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedTab === tab.id ? 'var(--danger-red)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedTab === tab.id ? 'var(--danger-red)' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  color: selectedTab === tab.id ? 'black' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="overview-content">
            {/* Key Metrics Grid */}
            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--success-green)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Kills / Deaths
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--success-green)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalKills} / {metrics.totalDeaths}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  K/D Ratio: {formatKDRatio(metrics.killDeathRatio)}
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--danger-red)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  ISK Destroyed
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--danger-red)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {formatISK(metrics.iskDestroyed)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  Solo: {metrics.soloKills} | Assist: {metrics.assistKills}
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--warning-orange)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  ISK Lost
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--warning-orange)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {formatISK(metrics.iskLost)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.totalDeaths} ship losses
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: `2px solid ${metrics.efficiencyRatio >= 50 ? 'var(--success-green)' : 'var(--danger-red)'}`
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Efficiency
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: metrics.efficiencyRatio >= 50 ? 'var(--success-green)' : 'var(--danger-red)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.efficiencyRatio.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  ISK efficiency ratio
                </div>
              </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="recent-activity-summary">
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
                ⚡ Recent Combat Activity
              </h2>
              <div className="activity-list" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {metrics.recentActivity.length > 0 ? (
                  metrics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} style={{
                      padding: 'var(--space-md)',
                      borderBottom: index < 4 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{
                          fontSize: '20px',
                          opacity: 0.8
                        }}>
                          {activity.type === 'kill' ? '💀' : '💥'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {activity.type === 'kill' ? 'Killed' : 'Lost'} {activity.shipName}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>
                            {activity.systemName} • {formatDateTime(activity.date)}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          color: activity.type === 'kill' ? 'var(--success-green)' : 'var(--danger-red)'
                        }}>
                          {formatISK(activity.value)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {activity.involvedCount} involved
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No recent combat activity found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kills Tab */}
        {selectedTab === 'kills' && (
          <div className="kills-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              💀 Kill Analysis ({metrics.totalKills} kills)
            </h2>
            
            {/* Top Victim Ships */}
            <div className="top-victim-ships" style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--success-green)' }}>
                🎯 Most Killed Ship Types
              </h3>
              <div className="ship-stats-grid" style={{
                display: 'grid',
                gap: 'var(--space-md)'
              }}>
                {metrics.topVictimShips.length > 0 ? (
                  metrics.topVictimShips.map((ship, index) => (
                    <div key={ship.shipTypeId} style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-cyan)' }}>
                          #{index + 1} {ship.shipName}
                        </h4>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                          Total value destroyed: {formatISK(ship.totalValue)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success-green)' }}>
                          {ship.count}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          kills
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No kill data available
                  </div>
                )}
              </div>
            </div>

            {/* Kill Activity Feed */}
            <div className="kill-activity">
              <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--success-green)' }}>
                🔥 Recent Kills
              </h3>
              <div className="activity-feed" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '40vh',
                overflowY: 'auto'
              }}>
                {metrics.recentActivity.filter(a => a.type === 'kill').length > 0 ? (
                  metrics.recentActivity.filter(a => a.type === 'kill').map((kill, index) => (
                    <div key={index} style={{
                      padding: 'var(--space-md)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          💀 Killed {kill.shipName}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {kill.systemName} • {formatDateTime(kill.date)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success-green)' }}>
                          {formatISK(kill.value)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {kill.involvedCount === 1 ? 'Solo kill' : `${kill.involvedCount} involved`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No kills found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Losses Tab */}
        {selectedTab === 'losses' && (
          <div className="losses-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              💥 Loss Analysis ({metrics.totalDeaths} deaths)
            </h2>
            
            {/* Top Loss Ships */}
            <div className="top-loss-ships" style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--danger-red)' }}>
                ⚠️ Most Lost Ship Types
              </h3>
              <div className="ship-stats-grid" style={{
                display: 'grid',
                gap: 'var(--space-md)'
              }}>
                {metrics.topLossShips.length > 0 ? (
                  metrics.topLossShips.map((ship, index) => (
                    <div key={ship.shipTypeId} style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary-cyan)' }}>
                          #{index + 1} {ship.shipName}
                        </h4>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                          Total value lost: {formatISK(ship.totalValue)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger-red)' }}>
                          {ship.count}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          losses
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No loss data available
                  </div>
                )}
              </div>
            </div>

            {/* Loss Activity Feed */}
            <div className="loss-activity">
              <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--danger-red)' }}>
                💔 Recent Losses
              </h3>
              <div className="activity-feed" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '40vh',
                overflowY: 'auto'
              }}>
                {metrics.recentActivity.filter(a => a.type === 'death').length > 0 ? (
                  metrics.recentActivity.filter(a => a.type === 'death').map((death, index) => (
                    <div key={index} style={{
                      padding: 'var(--space-md)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          💥 Lost {death.shipName}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {death.systemName} • {formatDateTime(death.date)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--danger-red)' }}>
                          {formatISK(death.value)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          vs {death.involvedCount} attackers
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No losses found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <div className="activity-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              📋 Recent Combat Activity ({metrics.recentActivity.length})
            </h2>
            <div className="full-activity-feed" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((activity, index) => (
                  <div key={index} style={{
                    padding: 'var(--space-md)',
                    borderBottom: index < metrics.recentActivity.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span style={{
                        fontSize: '20px',
                        opacity: 0.8
                      }}>
                        {activity.type === 'kill' ? '💀' : '💥'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {activity.type === 'kill' ? 'Killed' : 'Lost'} {activity.shipName}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {activity.systemName} • {formatDateTime(activity.date)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: activity.type === 'kill' ? 'var(--success-green)' : 'var(--danger-red)'
                      }}>
                        {activity.type === 'kill' ? '+' : '-'}{formatISK(activity.value)}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        {activity.type === 'kill' 
                          ? (activity.involvedCount === 1 ? 'Solo kill' : `${activity.involvedCount} involved`)
                          : `vs ${activity.involvedCount} attackers`
                        }
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No combat activity found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombatAnalytics;