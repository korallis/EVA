import React, { useEffect, useState } from 'react';
import CircularProgress from '../ui/CircularProgress';
import './SkillAnalysisPanel.css';

interface SkillAnalysisPanelProps {
  characterId?: number;
}

interface SkillCategory {
  name: string;
  level: number;
  maxLevel: number;
  skillpoints: number;
  maxSkillpoints: number;
}

const SkillAnalysisPanel: React.FC<SkillAnalysisPanelProps> = ({ characterId }) => {
  const [totalSP, setTotalSP] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (characterId) {
      loadSkillData();
    }
  }, [characterId]);

  const loadSkillData = async () => {
    try {
      setIsLoading(true);
      // Simulated data - replace with actual API calls
      setTotalSP(3467020);
      setTotalSkills(75);
      setCategories([
        { name: 'Spaceship Command', level: 5, maxLevel: 5, skillpoints: 512000, maxSkillpoints: 512000 },
        { name: 'Gunnery', level: 4, maxLevel: 5, skillpoints: 256000, maxSkillpoints: 512000 },
        { name: 'Missiles', level: 4, maxLevel: 5, skillpoints: 512000, maxSkillpoints: 512000 },
        { name: 'Drones', level: 4, maxLevel: 5, skillpoints: 512000, maxSkillpoints: 512000 },
        { name: 'Engineering', level: 3, maxLevel: 5, skillpoints: 128000, maxSkillpoints: 512000 },
      ]);
    } catch (error) {
      console.error('Failed to load skill data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const spPercentage = Math.round((totalSP / 500000000) * 100); // Max SP is ~500M

  return (
    <div className="skill-analysis-panel glass-panel">
      <div className="panel-header">
        <h2 className="panel-title">SKILL ANALYSIS</h2>
      </div>

      <div className="panel-content">
        {/* Main Progress Circle */}
        <div className="skill-overview">
          <CircularProgress
            value={spPercentage}
            size={140}
            strokeWidth={10}
            label="SP"
            displayValue={`${spPercentage}%`}
          />
          <div className="skill-stats">
            <div className="stat-item">
              <span className="stat-label">Total SP</span>
              <span className="stat-value">{totalSP.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Skills</span>
              <span className="stat-value">{totalSkills}</span>
            </div>
          </div>
        </div>

        {/* Skill Categories */}
        <div className="skill-categories">
          <h3 className="section-title">Skill Categories</h3>
          <div className="categories-list">
            {categories.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-header">
                  <span className="category-name">{category.name}</span>
                  <span className="category-level">Level {category.level}/{category.maxLevel}</span>
                </div>
                <div className="category-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${(category.level / category.maxLevel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="skill-footer">
          <div className="footer-stat">
            <span className="stat-label">Power</span>
            <span className="stat-value text-primary">3475</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Defense</span>
            <span className="stat-value text-primary">1150d</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">CPU</span>
            <span className="stat-value text-primary">275.9/575.0</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">PG</span>
            <span className="stat-value text-primary">625.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAnalysisPanel;