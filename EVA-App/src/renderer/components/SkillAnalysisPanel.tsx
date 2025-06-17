import React, { useState, useEffect } from 'react';
import CircularProgress from './CircularProgress';
import './SkillAnalysisPanel.css';

interface SkillStats {
  totalSP: number;
  trainedSkills: number;
  skillsInQueue: number;
  completionPercentage: number;
}

interface SkillCategory {
  name: string;
  level: number;
  progress: number;
  skills: number;
  color: string;
}

interface SkillAnalysisPanelProps {
  skillStats: SkillStats;
  characterId?: number;
}

const SkillAnalysisPanel: React.FC<SkillAnalysisPanelProps> = ({
  skillStats,
  characterId,
}) => {
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([
    { name: 'Gunnery', level: 4, progress: 75, skills: 28, color: '#FF7722' },
    { name: 'Missiles', level: 3, progress: 45, skills: 19, color: '#00D4FF' },
    { name: 'Engineering', level: 5, progress: 90, skills: 35, color: '#00CCAA' },
    { name: 'Electronics', level: 4, progress: 60, skills: 22, color: '#9F7AEA' },
    { name: 'Navigation', level: 4, progress: 80, skills: 15, color: '#0066FF' },
    { name: 'Armor', level: 3, progress: 30, skills: 12, color: '#FFA500' },
    { name: 'Shields', level: 4, progress: 85, skills: 18, color: '#00FFFF' },
    { name: 'Targeting', level: 4, progress: 70, skills: 8, color: '#FF69B4' },
  ]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const getSkillPointsDisplay = (): string => {
    return formatNumber(skillStats.totalSP);
  };

  return (
    <div className="skill-analysis-panel glass-panel">
      <div className="panel-header">
        <h2 className="text-h1 panel-title">Skill Analysis</h2>
        <div className="scan-line"></div>
      </div>

      <div className="panel-content">
        {/* Main Skill Progress Circle */}
        <div className="main-progress-section">
          <CircularProgress
            value={skillStats.completionPercentage}
            size={160}
            strokeWidth={12}
            color="var(--primary-cyan)"
            label="Overall Progress"
            className="main-progress"
          />
          
          <div className="skill-summary">
            <div className="skill-stat">
              <span className="stat-value text-h2">{getSkillPointsDisplay()}</span>
              <span className="stat-label text-small">Skill Points</span>
            </div>
            <div className="skill-stat">
              <span className="stat-value text-h2">{skillStats.trainedSkills}</span>
              <span className="stat-label text-small">Skills Trained</span>
            </div>
            <div className="skill-stat">
              <span className="stat-value text-h2">{skillStats.skillsInQueue}</span>
              <span className="stat-label text-small">In Queue</span>
            </div>
          </div>
        </div>

        {/* Skill Categories */}
        <div className="skill-categories-section">
          <h3 className="text-h3 section-title">Skill Categories</h3>
          
          <div className="categories-grid">
            {skillCategories.map((category, index) => (
              <div 
                key={category.name} 
                className="skill-category animate-material-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="category-header">
                  <div className="category-info">
                    <span className="category-name text-body">{category.name}</span>
                    <span className="category-level text-small">Level {category.level}</span>
                  </div>
                  <span className="category-skills text-tiny">{category.skills} skills</span>
                </div>
                
                <div className="category-progress">
                  <div className="progress-track">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${category.progress}%`,
                        backgroundColor: category.color,
                        boxShadow: `0 0 10px ${category.color}40`
                      }}
                    ></div>
                  </div>
                  <span className="progress-text text-tiny">{category.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Queue Preview */}
        <div className="skill-queue-section">
          <h3 className="text-h3 section-title">Training Queue</h3>
          
          <div className="queue-items">
            <div className="queue-item">
              <div className="queue-skill">
                <span className="skill-name text-body">Gunnery V</span>
                <span className="skill-time text-small">2d 14h 23m</span>
              </div>
              <div className="queue-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: '65%', backgroundColor: 'var(--primary-cyan)' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="queue-item">
              <div className="queue-skill">
                <span className="skill-name text-body">Large Energy Turret V</span>
                <span className="skill-time text-small">5d 8h 12m</span>
              </div>
              <div className="queue-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: '0%', backgroundColor: 'var(--text-light-gray)' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAnalysisPanel;