import React, { useState, useEffect, useContext } from 'react';
import { CharacterContext } from '../App';

interface IndustryJob {
  job_id: number;
  installer_id: number;
  facility_id: number;
  location_id: number;
  location_name?: string;
  activity_id: number;
  activity_name?: string;
  blueprint_id: number;
  blueprint_type_id: number;
  blueprint_type_name?: string;
  output_location_id: number;
  runs: number;
  cost?: number;
  licensed_runs?: number;
  probability?: number;
  product_type_id?: number;
  product_type_name?: string;
  status: string;
  duration: number;
  start_date: string;
  end_date: string;
  pause_date?: string;
  completed_date?: string;
  completed_character_id?: number;
  successful_runs?: number;
}

interface MiningOperation {
  date: string;
  type_id: number;
  type_name?: string;
  solar_system_id: number;
  solar_system_name?: string;
  quantity: number;
}

interface Blueprint {
  item_id: number;
  type_id: number;
  type_name?: string;
  location_id: number;
  location_name?: string;
  location_flag: string;
  quantity: number;
  time_efficiency: number;
  material_efficiency: number;
  runs: number;
  is_copy: boolean;
}

interface IndustryMetrics {
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  totalMining: number;
  uniqueOres: number;
  blueprintValue: number;
  totalBlueprints: number;
  averageME: number;
  averageTE: number;
}

const IndustryManagement: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [industryJobs, setIndustryJobs] = useState<IndustryJob[]>([]);
  const [miningLedger, setMiningLedger] = useState<MiningOperation[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [metrics, setMetrics] = useState<IndustryMetrics>({
    activeJobs: 0,
    completedJobs: 0,
    totalRevenue: 0,
    totalCosts: 0,
    profit: 0,
    totalMining: 0,
    uniqueOres: 0,
    blueprintValue: 0,
    totalBlueprints: 0,
    averageME: 0,
    averageTE: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'jobs' | 'mining' | 'blueprints'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && activeCharacter) {
      loadIndustryData();
    } else {
      setLoading(false);
    }
  }, [activeCharacter, isAuthenticated]);

  const loadIndustryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch industry data in parallel
      const [jobsResult, miningResult, blueprintsResult] = await Promise.allSettled([
        window.electronAPI.esi.getCharacterIndustryJobs(undefined, true), // Include completed jobs
        window.electronAPI.esi.getCharacterMiningLedger(),
        window.electronAPI.esi.getCharacterBlueprints()
      ]);

      // Process industry jobs
      if (jobsResult.status === 'fulfilled') {
        const jobs = jobsResult.value.map((job: any) => ({
          ...job,
          location_name: `Location ${job.location_id}`,
          activity_name: getActivityName(job.activity_id),
          blueprint_type_name: `Blueprint ${job.blueprint_type_id}`,
          product_type_name: job.product_type_id ? `Product ${job.product_type_id}` : undefined
        }));
        setIndustryJobs(jobs);
      }

      // Process mining ledger
      if (miningResult.status === 'fulfilled') {
        const mining = miningResult.value.map((entry: any) => ({
          ...entry,
          type_name: `Ore ${entry.type_id}`,
          solar_system_name: `System ${entry.solar_system_id}`
        }));
        setMiningLedger(mining);
      }

      // Process blueprints
      if (blueprintsResult.status === 'fulfilled') {
        const bps = blueprintsResult.value.map((bp: any) => ({
          ...bp,
          type_name: `Blueprint ${bp.type_id}`,
          location_name: `Location ${bp.location_id}`
        }));
        setBlueprints(bps);
      }

      // Calculate metrics
      calculateIndustryMetrics(
        jobsResult.status === 'fulfilled' ? jobsResult.value : [],
        miningResult.status === 'fulfilled' ? miningResult.value : [],
        blueprintsResult.status === 'fulfilled' ? blueprintsResult.value : []
      );

    } catch (error: any) {
      console.error('Failed to load industry data:', error);
      setError('Failed to load industry data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityName = (activityId: number): string => {
    const activities: Record<number, string> = {
      1: 'Manufacturing',
      3: 'TE Research',
      4: 'ME Research',
      5: 'Copying',
      7: 'Reverse Engineering',
      8: 'Invention',
      9: 'Reactions'
    };
    return activities[activityId] || `Activity ${activityId}`;
  };

  const calculateIndustryMetrics = (jobs: any[], mining: any[], bps: any[]) => {
    // Calculate job metrics
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const completedJobs = jobs.filter(job => job.status === 'delivered').length;
    
    // Estimate revenue and costs (simplified calculation)
    const totalCosts = jobs.reduce((sum, job) => sum + (job.cost || 0), 0);
    const totalRevenue = completedJobs * 10000000; // Simplified estimate
    const profit = totalRevenue - totalCosts;

    // Calculate mining metrics
    const totalMining = mining.reduce((sum, entry) => sum + entry.quantity, 0);
    const uniqueOres = new Set(mining.map(entry => entry.type_id)).size;

    // Calculate blueprint metrics
    const totalBlueprints = bps.length;
    const bpos = bps.filter(bp => !bp.is_copy);
    const averageME = bpos.length > 0 ? 
      Math.round(bpos.reduce((sum, bp) => sum + bp.material_efficiency, 0) / bpos.length) : 0;
    const averageTE = bpos.length > 0 ? 
      Math.round(bpos.reduce((sum, bp) => sum + bp.time_efficiency, 0) / bpos.length) : 0;
    
    // Estimate blueprint value (simplified)
    const blueprintValue = totalBlueprints * 50000000; // 50M ISK average per blueprint

    setMetrics({
      activeJobs,
      completedJobs,
      totalRevenue,
      totalCosts,
      profit,
      totalMining,
      uniqueOres,
      blueprintValue,
      totalBlueprints,
      averageME,
      averageTE
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

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getJobStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'var(--primary-cyan)';
      case 'paused': return 'var(--warning-orange)';
      case 'ready': return 'var(--success-green)';
      case 'delivered': return 'var(--info-blue)';
      case 'cancelled': return 'var(--danger-red)';
      default: return 'white';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Industry Management</h1>
          <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
            Comprehensive manufacturing, research, and mining management
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
          <h1 className="text-hero">Industry Management</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading industry data and calculating metrics...
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
          <h1 className="text-hero">Industry Management</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadIndustryData}>
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
        <div className="industry-management-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Industry Management</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Manufacturing empire management for {activeCharacter?.character_name}
          </p>

          {/* Tab Navigation */}
          <div className="tab-navigation" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'overview', name: 'Overview', icon: '🏭' },
              { id: 'jobs', name: 'Industry Jobs', icon: '⚙️' },
              { id: 'mining', name: 'Mining Ledger', icon: '⛏️' },
              { id: 'blueprints', name: 'Blueprints', icon: '📜' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedTab === tab.id ? 'var(--warning-orange)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedTab === tab.id ? 'var(--warning-orange)' : 'rgba(255, 255, 255, 0.2)'}`,
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
                border: '2px solid var(--primary-cyan)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Active Jobs
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--primary-cyan)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.activeJobs}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.completedJobs} completed jobs
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: `2px solid ${metrics.profit >= 0 ? 'var(--success-green)' : 'var(--danger-red)'}`
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Industry Profit
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: metrics.profit >= 0 ? 'var(--success-green)' : 'var(--danger-red)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.profit >= 0 ? '+' : ''}{formatISK(metrics.profit)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  Revenue: {formatISK(metrics.totalRevenue)}
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--warning-orange)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Total Mining
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--warning-orange)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {(metrics.totalMining / 1000000).toFixed(1)}M
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.uniqueOres} different ore types
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--info-blue)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Blueprint Portfolio
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--info-blue)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalBlueprints}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  Avg ME: {metrics.averageME}% / TE: {metrics.averageTE}%
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="quick-stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
              {/* Recent Jobs */}
              <div className="stat-section" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px'
              }}>
                <h3 style={{ margin: 0, marginBottom: 'var(--space-md)', color: 'var(--primary-cyan)' }}>
                  🔥 Recent Industry Jobs
                </h3>
                {industryJobs.slice(0, 5).map(job => (
                  <div key={job.job_id} style={{
                    padding: 'var(--space-sm)',
                    marginBottom: 'var(--space-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${getJobStatusColor(job.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {job.activity_name}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {job.blueprint_type_name} x{job.runs}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          color: getJobStatusColor(job.status),
                          textTransform: 'uppercase'
                        }}>
                          {job.status}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>
                          {job.status === 'active' ? 'Ends: ' + formatDate(job.end_date) : 'Duration: ' + formatDuration(job.duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {industryJobs.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.7, padding: 'var(--space-md)' }}>
                    No industry jobs found
                  </div>
                )}
              </div>

              {/* Top Mining Operations */}
              <div className="stat-section" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px'
              }}>
                <h3 style={{ margin: 0, marginBottom: 'var(--space-md)', color: 'var(--warning-orange)' }}>
                  ⛏️ Top Mining Operations
                </h3>
                {/* Aggregate mining by ore type */}
                {(() => {
                  const oreAggregates = new Map<number, { typeName: string; quantity: number; lastDate: string }>();
                  miningLedger.forEach(entry => {
                    const existing = oreAggregates.get(entry.type_id) || { 
                      typeName: entry.type_name || `Ore ${entry.type_id}`, 
                      quantity: 0, 
                      lastDate: entry.date 
                    };
                    existing.quantity += entry.quantity;
                    if (new Date(entry.date) > new Date(existing.lastDate)) {
                      existing.lastDate = entry.date;
                    }
                    oreAggregates.set(entry.type_id, existing);
                  });
                  
                  return Array.from(oreAggregates.entries())
                    .sort((a, b) => b[1].quantity - a[1].quantity)
                    .slice(0, 5)
                    .map(([typeId, data]) => (
                      <div key={typeId} style={{
                        padding: 'var(--space-sm)',
                        marginBottom: 'var(--space-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {data.typeName}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>
                            Last mined: {formatDate(data.lastDate)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning-orange)' }}>
                            {(data.quantity / 1000).toFixed(0)}K
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.6 }}>
                            units
                          </div>
                        </div>
                      </div>
                    ));
                })()}
                {miningLedger.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.7, padding: 'var(--space-md)' }}>
                    No mining operations found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Industry Jobs Tab */}
        {selectedTab === 'jobs' && (
          <div className="jobs-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              ⚙️ Industry Jobs ({industryJobs.length})
            </h2>
            <div className="jobs-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {industryJobs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Activity</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Blueprint</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Runs</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Duration</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Start Date</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industryJobs.map(job => (
                      <tr key={job.job_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{job.activity_name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>{job.location_name}</div>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{job.blueprint_type_name}</div>
                          {job.product_type_name && (
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>→ {job.product_type_name}</div>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          {job.runs}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getJobStatusColor(job.status),
                            color: 'black',
                            textTransform: 'uppercase'
                          }}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '12px' }}>
                          {formatDuration(job.duration)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '12px' }}>
                          {formatDate(job.start_date)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '12px' }}>
                          {formatDate(job.end_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No industry jobs found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mining Ledger Tab */}
        {selectedTab === 'mining' && (
          <div className="mining-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              ⛏️ Mining Ledger ({miningLedger.length} operations)
            </h2>
            <div className="mining-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {miningLedger.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Ore Type</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>System</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'right' }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miningLedger.map((entry, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <td style={{ padding: 'var(--space-md)', fontSize: '12px' }}>
                          {formatDate(entry.date)}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>{entry.type_name}</div>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          {entry.solar_system_name}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'right', fontWeight: 'bold' }}>
                          {entry.quantity.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No mining operations recorded
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blueprints Tab */}
        {selectedTab === 'blueprints' && (
          <div className="blueprints-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              📜 Blueprint Collection ({blueprints.length})
            </h2>
            <div className="blueprints-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-md)',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: 'var(--space-sm)'
            }}>
              {blueprints.length > 0 ? (
                blueprints.map(bp => (
                  <div
                    key={bp.item_id}
                    className="blueprint-card"
                    style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${bp.is_copy ? 'var(--warning-orange)' : 'var(--info-blue)'}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                      <h4 style={{ margin: 0, color: 'var(--primary-cyan)', fontSize: '16px' }}>
                        {bp.type_name}
                      </h4>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: bp.is_copy ? 'var(--warning-orange)' : 'var(--info-blue)',
                        color: 'black'
                      }}>
                        {bp.is_copy ? 'BPC' : 'BPO'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: 'var(--space-md)' }}>
                      {bp.location_name} ({bp.location_flag})
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: 'var(--space-sm)',
                      fontSize: '13px'
                    }}>
                      <div>
                        <strong>ME:</strong> {bp.material_efficiency}%
                      </div>
                      <div>
                        <strong>TE:</strong> {bp.time_efficiency}%
                      </div>
                      {bp.is_copy && (
                        <>
                          <div>
                            <strong>Runs:</strong> {bp.runs}
                          </div>
                          <div>
                            <strong>Qty:</strong> {bp.quantity}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No blueprints found in accessible locations
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustryManagement;