import React, { useState, useEffect } from 'react';
import './ContextPanel.css';

interface Character {
  character_id: number;
  character_name: string;
  corporation_id?: number;
  corporation_name?: string;
  training_active?: boolean;
  training_skill_name?: string;
  training_end_time?: string;
  last_updated?: string;
}

interface Skill {
  skill_id: number;
  name?: string;
  skillpoints_in_skill: number;
  trained_skill_level: number;
  active_skill_level: number;
}

interface ContextPanelProps {
  activeCharacter: Character | null;
  selectedSkill?: Skill | null;
  selectedView: 'home' | 'skills' | 'training' | 'character' | 'fitting';
  onAction?: (action: string, data?: any) => void;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
  activeCharacter,
  selectedSkill,
  selectedView,
  onAction
}) => {
  const [queueStats, setQueueStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [upcomingCompletions, setUpcomingCompletions] = useState<any[]>([]);

  useEffect(() => {
    loadContextData();
    const interval = setInterval(loadContextData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [activeCharacter, selectedView]);

  const loadContextData = async () => {
    try {
      // Load queue stats
      const queueData = await window.electronAPI.skillQueue.getStats();
      setQueueStats(queueData);

      // Load cache stats
      const cacheData = await window.electronAPI.cache.getStats();
      setCacheStats(cacheData);

      // Load upcoming completions
      const upcoming = await window.electronAPI.skillQueue.getUpcoming(24);
      setUpcomingCompletions(upcoming);
    } catch (error) {
      console.error('Failed to load context data:', error);
    }
  };

  const formatTimeRemaining = (endTime: string): string => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, end - now);

    if (remaining === 0) return 'Complete';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const handleQuickAction = async (action: string, data?: any) => {
    try {
      switch (action) {
        case 'refresh_queues':
          await window.electronAPI.skillQueue.checkNow();
          await loadContextData();
          break;
        case 'test_notification':
          await window.electronAPI.notifications.test();
          break;
        case 'clear_cache':
          await window.electronAPI.cache.clear();
          await loadContextData();
          break;
        case 'switch_character':
          if (data) {
            await window.electronAPI.characters.setActive(data);
          }
          break;
        default:
          if (onAction) {
            onAction(action, data);
          }
      }
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error);
    }
  };

  // Render different panels based on context
  const renderHomePanel = () => (
    <div className="context-panel-content">
      <div className="panel-section">
        <h3>🎯 Quick Actions</h3>
        <div className="action-grid">
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction('refresh_queues')}
            disabled={!activeCharacter}
          >
            <span className="action-icon">🔄</span>
            <span>Refresh Queues</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction('test_notification')}
          >
            <span className="action-icon">🔔</span>
            <span>Test Notification</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => onAction?.('view_skills')}
            disabled={!activeCharacter}
          >
            <span className="action-icon">📊</span>
            <span>View Skills</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => onAction?.('view_fitting')}
          >
            <span className="action-icon">🚢</span>
            <span>Ship Fitting</span>
          </button>
        </div>
      </div>

      {queueStats && (
        <div className="panel-section">
          <h3>📚 Training Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Characters</span>
              <span className="stat-value">{queueStats.totalCharacters}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Training</span>
              <span className="stat-value">{queueStats.activeTraining}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completions Today</span>
              <span className="stat-value">{queueStats.completionsSinceStart}</span>
            </div>
          </div>
        </div>
      )}

      {upcomingCompletions.length > 0 && (
        <div className="panel-section">
          <h3>⏰ Upcoming Completions</h3>
          <div className="upcoming-list">
            {upcomingCompletions.slice(0, 5).map((completion, index) => (
              <div key={index} className="upcoming-item">
                <div className="completion-character">{completion.characterName}</div>
                <div className="completion-skill">{completion.skillName} {completion.skillLevel}</div>
                <div className="completion-time">{formatTimeRemaining(completion.completionTime)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cacheStats && (
        <div className="panel-section">
          <h3>💾 Performance</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Cache Hit Rate</span>
              <span className="stat-value">{Math.round(cacheStats.hitRate)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Cached Items</span>
              <span className="stat-value">{cacheStats.totalEntries}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory Usage</span>
              <span className="stat-value">{Math.round(cacheStats.memoryUsage / 1024)}KB</span>
            </div>
          </div>
          <button 
            className="panel-action-btn secondary"
            onClick={() => handleQuickAction('clear_cache')}
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );

  const renderCharacterPanel = () => (
    <div className="context-panel-content">
      {activeCharacter ? (
        <>
          <div className="panel-section">
            <h3>👤 {activeCharacter.character_name}</h3>
            <div className="character-details">
              <div className="detail-row">
                <span className="detail-label">Character ID:</span>
                <span className="detail-value">{activeCharacter.character_id}</span>
              </div>
              {activeCharacter.corporation_name && (
                <div className="detail-row">
                  <span className="detail-label">Corporation:</span>
                  <span className="detail-value">{activeCharacter.corporation_name}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {activeCharacter.last_updated 
                    ? new Date(activeCharacter.last_updated).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>

          {activeCharacter.training_active && (
            <div className="panel-section">
              <h3>🎓 Current Training</h3>
              <div className="training-info">
                <div className="training-skill">{activeCharacter.training_skill_name}</div>
                <div className="training-time">
                  {activeCharacter.training_end_time && 
                    formatTimeRemaining(activeCharacter.training_end_time)
                  }
                </div>
              </div>
              <div className="training-actions">
                <button 
                  className="panel-action-btn"
                  onClick={() => onAction?.('view_training')}
                >
                  View Queue
                </button>
                <button 
                  className="panel-action-btn secondary"
                  onClick={() => handleQuickAction('refresh_queues', activeCharacter.character_id)}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          <div className="panel-section">
            <h3>⚡ Quick Actions</h3>
            <div className="action-list">
              <button 
                className="panel-action-btn"
                onClick={() => onAction?.('view_skills')}
              >
                View Skills
              </button>
              <button 
                className="panel-action-btn"
                onClick={() => onAction?.('view_training')}
              >
                Training Queue
              </button>
              <button 
                className="panel-action-btn secondary"
                onClick={() => handleQuickAction('refresh_queues', activeCharacter.character_id)}
              >
                Update Character
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel-section">
          <h3>👤 No Character Selected</h3>
          <p>Add a character to view detailed information and manage training.</p>
          <button 
            className="panel-action-btn"
            onClick={() => onAction?.('add_character')}
          >
            Add Character
          </button>
        </div>
      )}
    </div>
  );

  const renderSkillPanel = () => (
    <div className="context-panel-content">
      {selectedSkill ? (
        <>
          <div className="panel-section">
            <h3>🎯 {selectedSkill.name || `Skill ${selectedSkill.skill_id}`}</h3>
            <div className="skill-details">
              <div className="detail-row">
                <span className="detail-label">Current Level:</span>
                <span className="detail-value">{selectedSkill.trained_skill_level}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Skill Points:</span>
                <span className="detail-value">{formatNumber(selectedSkill.skillpoints_in_skill)}</span>
              </div>
              {selectedSkill.active_skill_level !== selectedSkill.trained_skill_level && (
                <div className="detail-row">
                  <span className="detail-label">Training to:</span>
                  <span className="detail-value">{selectedSkill.active_skill_level}</span>
                </div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <h3>📈 Training Options</h3>
            <div className="training-options">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  className={`level-btn ${selectedSkill.trained_skill_level >= level ? 'completed' : ''}`}
                  disabled={selectedSkill.trained_skill_level >= level}
                  onClick={() => onAction?.('train_skill', { skillId: selectedSkill.skill_id, level })}
                >
                  Level {level}
                </button>
              ))}
            </div>
            <div className="skill-actions">
              <button 
                className="panel-action-btn"
                onClick={() => onAction?.('add_to_queue', selectedSkill)}
                disabled={selectedSkill.trained_skill_level >= 5}
              >
                Add to Queue
              </button>
              <button 
                className="panel-action-btn secondary"
                onClick={() => onAction?.('skill_info', selectedSkill)}
              >
                View Details
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel-section">
          <h3>🎯 Skill Information</h3>
          <p>Select a skill from the list to view details and training options.</p>
          {activeCharacter && (
            <button 
              className="panel-action-btn"
              onClick={() => onAction?.('view_skills')}
            >
              Browse Skills
            </button>
          )}
        </div>
      )}

      <div className="panel-section">
        <h3>📊 Skill Overview</h3>
        <div className="skill-stats">
          <div className="stat-item">
            <span className="stat-label">Total Skills</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total SP</span>
            <span className="stat-value">-</span>
          </div>
        </div>
        <button 
          className="panel-action-btn secondary"
          onClick={() => onAction?.('refresh_skills')}
          disabled={!activeCharacter}
        >
          Refresh Skills
        </button>
      </div>
    </div>
  );

  const renderTrainingPanel = () => (
    <div className="context-panel-content">
      <div className="panel-section">
        <h3>📚 Training Queue</h3>
        {activeCharacter?.training_active ? (
          <div className="current-training">
            <div className="training-skill">{activeCharacter.training_skill_name}</div>
            <div className="training-time">
              {activeCharacter.training_end_time && 
                formatTimeRemaining(activeCharacter.training_end_time)
              }
            </div>
          </div>
        ) : (
          <div className="no-training">
            <p>No active training</p>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>⚡ Queue Actions</h3>
        <div className="action-list">
          <button 
            className="panel-action-btn"
            onClick={() => handleQuickAction('refresh_queues', activeCharacter?.character_id)}
            disabled={!activeCharacter}
          >
            Refresh Queue
          </button>
          <button 
            className="panel-action-btn"
            onClick={() => onAction?.('optimize_queue')}
            disabled={!activeCharacter}
          >
            Optimize Training
          </button>
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('export_queue')}
            disabled={!activeCharacter}
          >
            Export Queue
          </button>
        </div>
      </div>

      {queueStats && (
        <div className="panel-section">
          <h3>📈 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Active Training</span>
              <span className="stat-value">{queueStats.activeTraining}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Check</span>
              <span className="stat-value">
                {queueStats.lastCheckTime 
                  ? new Date(queueStats.lastCheckTime).toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFittingPanel = () => (
    <div className="context-panel-content">
      <div className="panel-section">
        <h3>🚢 Ship Fitting</h3>
        <div className="fitting-tools">
          <button 
            className="panel-action-btn"
            onClick={() => onAction?.('new_fitting')}
          >
            New Fitting
          </button>
          <button 
            className="panel-action-btn"
            onClick={() => onAction?.('load_fitting')}
          >
            Load Fitting
          </button>
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('import_fitting')}
          >
            Import from EVE
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>📊 DPS Calculator</h3>
        <p>Advanced damage calculations with proper stacking penalties and target profiles.</p>
        <div className="calculator-options">
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('target_profiles')}
          >
            Target Profiles
          </button>
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('compare_fittings')}
          >
            Compare Fittings
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>🔧 Tools</h3>
        <div className="action-list">
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('import_sde')}
          >
            Import SDE Data
          </button>
          <button 
            className="panel-action-btn secondary"
            onClick={() => onAction?.('export_eft')}
          >
            Export to EFT
          </button>
        </div>
      </div>
    </div>
  );

  // Main render logic
  const renderContent = () => {
    switch (selectedView) {
      case 'character':
        return renderCharacterPanel();
      case 'skills':
        return renderSkillPanel();
      case 'training':
        return renderTrainingPanel();
      case 'fitting':
        return renderFittingPanel();
      default:
        return renderHomePanel();
    }
  };

  return (
    <div className="context-panel">
      <div className="panel-header">
        <div className="panel-title">
          {selectedView === 'home' && '🏠 Dashboard'}
          {selectedView === 'character' && '👤 Character'}
          {selectedView === 'skills' && '🎯 Skills'}
          {selectedView === 'training' && '📚 Training'}
          {selectedView === 'fitting' && '🚢 Fitting'}
        </div>
        <button 
          className="panel-refresh-btn"
          onClick={loadContextData}
          title="Refresh"
        >
          🔄
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default ContextPanel;