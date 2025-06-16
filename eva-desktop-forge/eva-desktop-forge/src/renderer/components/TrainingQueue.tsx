import React, { useState, useEffect } from 'react';
import './TrainingQueue.css';

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

interface SkillType {
  name: string;
  description?: string;
  group_id?: number;
}

interface QueueStats {
  totalTime: number;
  totalSP: number;
  currentSkill: SkillQueueItem | null;
  emptySlots: number;
}

const TrainingQueue: React.FC = () => {
  const [skillQueue, setSkillQueue] = useState<SkillQueueItem[]>([]);
  const [skillTypes, setSkillTypes] = useState<Record<number, SkillType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    totalTime: 0,
    totalSP: 0,
    currentSkill: null,
    emptySlots: 50
  });

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadQueueData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading training queue...');
      
      const queue = await window.electronAPI.esi.getCharacterSkillQueue('');
      setSkillQueue(queue);
      
      console.log('✅ Training queue loaded:', queue.length || 0, 'items');
      
      // Get unique skill IDs
      const skillIds = new Set<number>();
      queue.forEach((item: SkillQueueItem) => skillIds.add(item.skill_id));
      
      // Fetch skill type information
      if (skillIds.size > 0) {
        const types = await window.electronAPI.esi.getSkillTypes(Array.from(skillIds));
        setSkillTypes(types);
      }
      
      // Calculate queue statistics
      calculateQueueStats(queue);
      
    } catch (error: any) {
      console.error('❌ Failed to load queue:', error);
      setError(error.message || 'Failed to load training queue');
    } finally {
      setLoading(false);
    }
  };

  const calculateQueueStats = (queue: SkillQueueItem[]) => {
    const now = new Date();
    let totalTime = 0;
    let totalSP = 0;
    let currentSkill = null;
    
    for (const item of queue) {
      if (item.finish_date) {
        const finishTime = new Date(item.finish_date).getTime();
        const timeRemaining = finishTime - now.getTime();
        
        if (timeRemaining > 0) {
          totalTime += timeRemaining;
          
          if (!currentSkill && item.start_date) {
            const startTime = new Date(item.start_date).getTime();
            if (startTime <= now.getTime()) {
              currentSkill = item;
            }
          }
        }
      }
      
      if (item.level_end_sp && item.level_start_sp) {
        totalSP += item.level_end_sp - item.level_start_sp;
      }
    }
    
    setQueueStats({
      totalTime,
      totalSP,
      currentSkill,
      emptySlots: 50 - queue.length
    });
  };

  const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
  };

  const formatSP = (sp: number): string => {
    if (sp >= 1000000) {
      return `${(sp / 1000000).toFixed(2)}M SP`;
    } else if (sp >= 1000) {
      return `${(sp / 1000).toFixed(0)}K SP`;
    }
    return `${sp} SP`;
  };

  const getSkillProgress = (item: SkillQueueItem): number => {
    if (!item.start_date || !item.finish_date) return 0;
    
    const now = new Date().getTime();
    const start = new Date(item.start_date).getTime();
    const finish = new Date(item.finish_date).getTime();
    
    if (now >= finish) return 100;
    if (now <= start) return 0;
    
    const total = finish - start;
    const elapsed = now - start;
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getTimeRemaining = (finishDate?: string): string => {
    if (!finishDate) return 'Unknown';
    
    const finish = new Date(finishDate);
    const now = new Date();
    const diff = finish.getTime() - now.getTime();
    
    if (diff <= 0) return 'Completed';
    
    return formatDuration(diff);
  };

  if (loading && skillQueue.length === 0) {
    return (
      <div className="training-queue">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading training queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-queue">
        <div className="error-container">
          <h3>Error Loading Queue</h3>
          <p>{error}</p>
          <button onClick={loadQueueData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-queue">
      <div className="queue-header">
        <h2>Training Queue</h2>
        <div className="queue-stats">
          <div className="stat-item">
            <span className="stat-label">Total Duration:</span>
            <span className="stat-value">{formatDuration(queueStats.totalTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total SP:</span>
            <span className="stat-value">{formatSP(queueStats.totalSP)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Queue Slots:</span>
            <span className="stat-value">{skillQueue.length}/50</span>
          </div>
          {queueStats.emptySlots > 0 && (
            <div className="stat-item warning">
              <span className="stat-label">Empty Slots:</span>
              <span className="stat-value">{queueStats.emptySlots}</span>
            </div>
          )}
        </div>
      </div>

      {queueStats.currentSkill && (
        <div className="current-training">
          <h3>Currently Training</h3>
          <div className="current-skill">
            <div className="skill-header">
              <div className="skill-name">
                {skillTypes[queueStats.currentSkill.skill_id]?.name || `Skill ID: ${queueStats.currentSkill.skill_id}`}
              </div>
              <div className="skill-level">Level {queueStats.currentSkill.finished_level}</div>
            </div>
            <div className="progress-container">
              <div className="progress-bar large">
                <div 
                  className="progress-fill active"
                  style={{ width: `${getSkillProgress(queueStats.currentSkill)}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span className="time-remaining">{getTimeRemaining(queueStats.currentSkill.finish_date)}</span>
                <span className="finish-time">
                  {queueStats.currentSkill.finish_date ? 
                    new Date(queueStats.currentSkill.finish_date).toLocaleString() : 
                    'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="queue-timeline">
        <h3>Queue Timeline</h3>
        <div className="timeline-container">
          {skillQueue.length > 0 ? (
            <div className="timeline-items">
              {skillQueue.map((item, index) => {
                const progress = getSkillProgress(item);
                const isActive = progress > 0 && progress < 100;
                const isPending = progress === 0;
                
                return (
                  <div 
                    key={`${item.skill_id}-${item.queue_position}`} 
                    className={`timeline-item ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                  >
                    <div className="timeline-marker">
                      <div className="marker-dot"></div>
                      {index < skillQueue.length - 1 && <div className="marker-line"></div>}
                    </div>
                    
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="skill-info">
                          <span className="queue-position">#{item.queue_position}</span>
                          <span className="skill-name">
                            {skillTypes[item.skill_id]?.name || `Skill ID: ${item.skill_id}`}
                          </span>
                          <span className="skill-level">→ Level {item.finished_level}</span>
                        </div>
                        <div className="time-info">
                          <span className="duration">{getTimeRemaining(item.finish_date)}</span>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="timeline-progress">
                          <div className="progress-bar small">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="timeline-details">
                        {item.start_date && (
                          <span className="start-time">
                            Start: {new Date(item.start_date).toLocaleString()}
                          </span>
                        )}
                        {item.finish_date && (
                          <span className="end-time">
                            End: {new Date(item.finish_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-queue">
              <p>No skills in training queue</p>
              <small>Add skills to your queue in EVE Online</small>
            </div>
          )}
        </div>
      </div>

      <div className="queue-actions">
        <button onClick={loadQueueData} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Queue'}
        </button>
      </div>
    </div>
  );
};

export default TrainingQueue;