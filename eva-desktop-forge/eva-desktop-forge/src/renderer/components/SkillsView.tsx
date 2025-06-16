import React, { useState, useEffect } from 'react';
import './SkillsView.css';

interface Skill {
  skill_id: number;
  skillpoints_in_skill: number;
  trained_skill_level: number;
  active_skill_level: number;
}

interface SkillType {
  name: string;
  description?: string;
  group_id?: number;
}

interface SkillsData {
  skills: Skill[];
  total_sp: number;
  unallocated_sp?: number;
}

interface SkillQueueItem {
  skill_id: number;
  finished_level: number;
  queue_position: number;
  level_end_sp?: number;
  level_start_sp?: number;
  training_start_sp?: number;
  finish_date?: string;
  start_date?: string;
}

const SkillsView: React.FC = () => {
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
  const [skillQueue, setSkillQueue] = useState<SkillQueueItem[]>([]);
  const [skillTypes, setSkillTypes] = useState<Record<number, SkillType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'queue' | 'timeline'>('skills');

  useEffect(() => {
    loadSkillsData();
  }, []);

  const loadSkillsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading skills data...');
      
      const [skills, queue] = await Promise.all([
        window.electronAPI.esi.getCharacterSkills(''),
        window.electronAPI.esi.getCharacterSkillQueue('')
      ]);
      
      setSkillsData(skills);
      setSkillQueue(queue);
      
      console.log('✅ Skills data loaded:', skills.skills?.length || 0, 'skills');
      console.log('✅ Skill queue loaded:', queue.length || 0, 'items');
      
      // Get unique skill IDs from both skills and queue
      const skillIds = new Set<number>();
      skills.skills?.forEach((skill: Skill) => skillIds.add(skill.skill_id));
      queue.forEach((item: SkillQueueItem) => skillIds.add(item.skill_id));
      
      // Fetch skill type information
      if (skillIds.size > 0) {
        console.log('🔍 Loading skill type information...');
        const types = await window.electronAPI.esi.getSkillTypes(Array.from(skillIds));
        setSkillTypes(types);
        console.log('✅ Skill types loaded:', Object.keys(types).length);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to load skills:', error);
      setError(error.message || 'Failed to load skills data');
    } finally {
      setLoading(false);
    }
  };

  const formatSkillPoints = (sp: number): string => {
    if (sp >= 1000000) {
      return `${(sp / 1000000).toFixed(1)}M SP`;
    } else if (sp >= 1000) {
      return `${(sp / 1000).toFixed(0)}K SP`;
    }
    return `${sp} SP`;
  };

  const formatTimeRemaining = (finishDate?: string): string => {
    if (!finishDate) return 'Unknown';
    
    const finish = new Date(finishDate);
    const now = new Date();
    const diff = finish.getTime() - now.getTime();
    
    if (diff <= 0) return 'Completed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const calculateTimelineData = () => {
    if (!skillQueue.length) return [];

    const now = new Date();
    let currentTime = now;
    
    return skillQueue.map((item, index) => {
      const startTime = new Date(item.start_date || currentTime);
      const endTime = new Date(item.finish_date || currentTime);
      const duration = endTime.getTime() - startTime.getTime();
      const progress = Math.max(0, Math.min(100, ((now.getTime() - startTime.getTime()) / duration) * 100));
      
      currentTime = endTime;
      
      return {
        ...item,
        startTime,
        endTime,
        duration,
        progress: item.finish_date && new Date(item.finish_date) > now ? progress : 100,
        isActive: index === 0 && new Date(item.finish_date || 0) > now,
        skillName: skillTypes[item.skill_id]?.name || `Skill ID: ${item.skill_id}`
      };
    });
  };

  if (loading) {
    return (
      <div className="skills-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading skills data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skills-view">
        <div className="error-container">
          <h3>Error Loading Skills</h3>
          <p>{error}</p>
          <button onClick={loadSkillsData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-view">
      <div className="skills-header">
        <h2>Character Skills</h2>
        {skillsData && (
          <div className="skills-summary">
            <div className="summary-item">
              <span className="summary-label">Total Skills:</span>
              <span className="summary-value">{skillsData.skills?.length || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total SP:</span>
              <span className="summary-value">{formatSkillPoints(skillsData.total_sp || 0)}</span>
            </div>
            {skillsData.unallocated_sp && (
              <div className="summary-item">
                <span className="summary-label">Unallocated SP:</span>
                <span className="summary-value">{formatSkillPoints(skillsData.unallocated_sp)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="skills-tabs">
        <button 
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills ({skillsData?.skills?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Training Queue ({skillQueue.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="skills-content">
        {activeTab === 'skills' && (
          <div className="skills-list">
            {skillsData?.skills?.length ? (
              <div className="skills-grid">
                {skillsData.skills.map((skill) => (
                  <div key={skill.skill_id} className="skill-card">
                    <div className="skill-info">
                      <div className="skill-name">{skillTypes[skill.skill_id]?.name || `Skill ID: ${skill.skill_id}`}</div>
                      <div className="skill-level">Level {skill.trained_skill_level}/5</div>
                    </div>
                    <div className="skill-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(skill.trained_skill_level / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className="skill-sp">{formatSkillPoints(skill.skillpoints_in_skill)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No skills data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="queue-list">
            {skillQueue.length ? (
              <div className="queue-items">
                {skillQueue.map((item) => (
                  <div key={`${item.skill_id}-${item.queue_position}`} className="queue-item">
                    <div className="queue-position">#{item.queue_position}</div>
                    <div className="queue-info">
                      <div className="queue-skill">{skillTypes[item.skill_id]?.name || `Skill ID: ${item.skill_id}`}</div>
                      <div className="queue-level">Training to Level {item.finished_level}</div>
                    </div>
                    <div className="queue-time">
                      <div className="time-remaining">{formatTimeRemaining(item.finish_date)}</div>
                      <div className="finish-date">
                        {item.finish_date ? new Date(item.finish_date).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No skills currently training</p>
                <small>Add skills to your training queue in-game</small>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-view">
            {skillQueue.length ? (
              <div className="timeline-container">
                <div className="timeline-header">
                  <h3>Training Timeline</h3>
                  <div className="timeline-legend">
                    <div className="legend-item">
                      <div className="legend-color active"></div>
                      <span>Currently Training</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color queued"></div>
                      <span>Queued</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color completed"></div>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
                
                <div className="timeline-content">
                  {calculateTimelineData().map((item, index) => (
                    <div key={`timeline-${item.skill_id}-${item.queue_position}`} className={`timeline-item ${item.isActive ? 'active' : ''}`}>
                      <div className="timeline-marker">
                        <div className={`timeline-dot ${item.isActive ? 'active' : item.progress === 100 ? 'completed' : 'queued'}`}></div>
                        {index < skillQueue.length - 1 && <div className="timeline-line"></div>}
                      </div>
                      
                      <div className="timeline-content-item">
                        <div className="timeline-skill-info">
                          <div className="timeline-skill-name">{item.skillName}</div>
                          <div className="timeline-skill-level">Level {item.finished_level}</div>
                        </div>
                        
                        <div className="timeline-progress">
                          <div className="timeline-progress-bar">
                            <div 
                              className={`timeline-progress-fill ${item.isActive ? 'active' : item.progress === 100 ? 'completed' : 'queued'}`}
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <div className="timeline-progress-text">
                            {item.progress === 100 ? 'Completed' : `${Math.round(item.progress)}%`}
                          </div>
                        </div>
                        
                        <div className="timeline-times">
                          <div className="timeline-start">
                            Start: {item.startTime.toLocaleDateString()} {item.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="timeline-end">
                            End: {item.endTime.toLocaleDateString()} {item.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="timeline-duration">
                            Duration: {formatTimeRemaining(item.finish_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="timeline-summary">
                  <div className="summary-stat">
                    <span className="stat-label">Total Queue Time:</span>
                    <span className="stat-value">
                      {skillQueue.length > 0 && skillQueue[skillQueue.length - 1].finish_date 
                        ? formatTimeRemaining(skillQueue[skillQueue.length - 1].finish_date)
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Queue Completion:</span>
                    <span className="stat-value">
                      {skillQueue.length > 0 && skillQueue[skillQueue.length - 1].finish_date 
                        ? new Date(skillQueue[skillQueue.length - 1].finish_date).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No training timeline available</p>
                <small>Add skills to your training queue in-game to see the timeline</small>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="skills-actions">
        <button onClick={loadSkillsData} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default SkillsView;