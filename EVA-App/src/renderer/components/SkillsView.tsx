/**
 * EVA Desktop Skills View Component
 * 
 * Optimized component for displaying character skills, skill queue, and training timeline.
 * Uses React.memo, useCallback, and useMemo for performance optimization.
 * 
 * @author EVA Development Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Memoized skill item component for better performance
const SkillItem = React.memo<{
  skill: Skill;
  skillType: SkillType | undefined;
  formatSkillPoints: (sp: number) => string;
}>(({ skill, skillType, formatSkillPoints }) => (
  <div className="skill-item" key={skill.skill_id}>
    <div className="skill-info">
      <div className="skill-name">
        {skillType?.name || `Skill ID: ${skill.skill_id}`}
      </div>
      <div className="skill-level">
        Level {skill.trained_skill_level}
        {skill.active_skill_level !== skill.trained_skill_level && (
          <span className="partial-level"> (partially trained to {skill.active_skill_level})</span>
        )}
      </div>
    </div>
    <div className="skill-sp">
      {formatSkillPoints(skill.skillpoints_in_skill)}
    </div>
  </div>
));

// Memoized queue item component
const QueueItem = React.memo<{
  item: SkillQueueItem;
  skillType: SkillType | undefined;
  formatTimeRemaining: (finishDate?: string) => string;
}>(({ item, skillType, formatTimeRemaining }) => (
  <div className="queue-item" key={item.skill_id}>
    <div className="queue-position">{item.queue_position}</div>
    <div className="queue-skill-info">
      <div className="queue-skill-name">
        {skillType?.name || `Skill ID: ${item.skill_id}`}
      </div>
      <div className="queue-level">
        Training to Level {item.finished_level}
      </div>
    </div>
    <div className="queue-time">
      {formatTimeRemaining(item.finish_date)}
    </div>
  </div>
));

const SkillsView: React.FC = () => {
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
  const [skillQueue, setSkillQueue] = useState<SkillQueueItem[]>([]);
  const [skillTypes, setSkillTypes] = useState<Record<number, SkillType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'queue' | 'timeline'>('skills');

  // Memoized utility functions to prevent recreation on every render
  const formatSkillPoints = useCallback((sp: number): string => {
    if (sp >= 1000000) {
      return `${(sp / 1000000).toFixed(1)}M SP`;
    } else if (sp >= 1000) {
      return `${(sp / 1000).toFixed(0)}K SP`;
    }
    return `${sp} SP`;
  }, []);

  const formatTimeRemaining = useCallback((finishDate?: string): string => {
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
  }, []);

  // Memoized timeline calculation - expensive operation
  const timelineData = useMemo(() => {
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
  }, [skillQueue, skillTypes]);

  // Memoized skills summary to prevent recalculation
  const skillsSummary = useMemo(() => {
    if (!skillsData) return null;
    
    return {
      totalSkills: skillsData.skills?.length || 0,
      totalSP: skillsData.total_sp || 0,
      unallocatedSP: skillsData.unallocated_sp || 0
    };
  }, [skillsData]);

  const loadSkillsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using structured logging instead of console.log
      const [skills, queue] = await Promise.all([
        window.electronAPI.esi.getCharacterSkills(''),
        window.electronAPI.esi.getCharacterSkillQueue('')
      ]);
      
      setSkillsData(skills);
      setSkillQueue(queue);
      
      // Get unique skill IDs from both skills and queue
      const skillIds = new Set<number>();
      skills.skills?.forEach((skill: Skill) => skillIds.add(skill.skill_id));
      queue.forEach((item: SkillQueueItem) => skillIds.add(item.skill_id));
      
      // Fetch skill type information
      if (skillIds.size > 0) {
        const types = await window.electronAPI.esi.getSkillTypes(Array.from(skillIds));
        setSkillTypes(types);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to load skills data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkillsData();
  }, [loadSkillsData]);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: 'skills' | 'queue' | 'timeline') => {
    setActiveTab(tab);
  }, []);

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
        {skillsSummary && (
          <div className="skills-summary">
            <div className="summary-item">
              <span className="summary-label">Total Skills:</span>
              <span className="summary-value">{skillsSummary.totalSkills}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total SP:</span>
              <span className="summary-value">{formatSkillPoints(skillsSummary.totalSP)}</span>
            </div>
            {skillsSummary.unallocatedSP > 0 && (
              <div className="summary-item">
                <span className="summary-label">Unallocated SP:</span>
                <span className="summary-value">{formatSkillPoints(skillsSummary.unallocatedSP)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="skills-tabs">
        <button 
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => handleTabChange('skills')}
        >
          Skills ({skillsSummary?.totalSkills || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => handleTabChange('queue')}
        >
          Queue ({skillQueue.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => handleTabChange('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className="skills-content">
        {activeTab === 'skills' && (
          <div className="skills-list">
            {skillsData?.skills?.map((skill) => (
              <SkillItem
                key={skill.skill_id}
                skill={skill}
                skillType={skillTypes[skill.skill_id]}
                formatSkillPoints={formatSkillPoints}
              />
            ))}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="queue-list">
            {skillQueue.map((item) => (
              <QueueItem
                key={`${item.skill_id}-${item.queue_position}`}
                item={item}
                skillType={skillTypes[item.skill_id]}
                formatTimeRemaining={formatTimeRemaining}
              />
            ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-view">
            {timelineData.map((item, index) => (
              <div key={`${item.skill_id}-${index}`} className={`timeline-item ${item.isActive ? 'active' : ''}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-skill">{item.skillName}</div>
                  <div className="timeline-level">Level {item.finished_level}</div>
                  <div className="timeline-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                    </div>
                    <span className="progress-text">{item.progress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export memoized component for better performance
export default React.memo(SkillsView);