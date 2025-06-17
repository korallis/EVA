import React, { useState, useEffect } from 'react';
import './CharacterInfo.css';

interface Character {
  character_id: number;
  character_name: string;
  expires_on: string;
  scopes: string;
  token_type: string;
}

interface CharacterAttributes {
  charisma: number;
  intelligence: number;
  memory: number;
  perception: number;
  willpower: number;
  bonus_remaps?: number;
  last_remap_date?: string;
  accrued_remap_cooldown_date?: string;
}

interface CharacterSkills {
  skills: Array<{
    skill_id: number;
    skillpoints_in_skill: number;
    trained_skill_level: number;
    active_skill_level: number;
  }>;
  total_sp: number;
  unallocated_sp?: number;
}

const CharacterInfo: React.FC = () => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [attributes, setAttributes] = useState<CharacterAttributes | null>(null);
  const [skillsData, setSkillsData] = useState<CharacterSkills | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacterData();
  }, []);

  const loadCharacterData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading character data...');
      
      // Get basic character info
      const charData = await window.electronAPI.auth.getCharacter();
      setCharacter(charData);
      
      if (charData) {
        // Get skills data for SP totals
        const skills = await window.electronAPI.esi.getCharacterSkills('');
        setSkillsData(skills);
        
        // TODO: Get character attributes when ESI endpoint is added
        // For now, use dummy data
        setAttributes({
          charisma: 20,
          intelligence: 27,
          memory: 21,
          perception: 21,
          willpower: 21,
          bonus_remaps: 2,
          last_remap_date: '2023-01-15T00:00:00Z',
          accrued_remap_cooldown_date: '2024-01-15T00:00:00Z'
        });
      }
      
      console.log('✅ Character data loaded');
      
    } catch (error: any) {
      console.error('❌ Failed to load character:', error);
      setError(error.message || 'Failed to load character data');
    } finally {
      setLoading(false);
    }
  };

  const formatSP = (sp: number): string => {
    if (sp >= 1000000) {
      return `${(sp / 1000000).toFixed(1)}M`;
    } else if (sp >= 1000) {
      return `${(sp / 1000).toFixed(0)}K`;
    }
    return sp.toString();
  };

  const calculateOptimalMapping = (): string => {
    // This is a simplified calculation
    // In reality, you'd analyze the current skill queue
    return "INT/MEM (For current queue)";
  };

  const getRemapAvailability = (): string => {
    if (!attributes?.accrued_remap_cooldown_date) return "Unknown";
    
    const cooldownDate = new Date(attributes.accrued_remap_cooldown_date);
    const now = new Date();
    
    if (cooldownDate <= now) {
      return "Available Now";
    }
    
    const diff = cooldownDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `Available in ${days} days`;
  };

  const getSkillGroupStats = () => {
    if (!skillsData) return null;
    
    // Group skills by level
    const levelCounts = [0, 0, 0, 0, 0, 0]; // Index 0 unused, 1-5 for levels
    let maxLevel = 0;
    
    skillsData.skills.forEach(skill => {
      levelCounts[skill.trained_skill_level]++;
      if (skill.trained_skill_level === 5) maxLevel++;
    });
    
    return {
      total: skillsData.skills.length,
      level5: levelCounts[5],
      level4: levelCounts[4],
      level3: levelCounts[3],
      level2: levelCounts[2],
      level1: levelCounts[1],
      level0: levelCounts[0]
    };
  };

  if (loading) {
    return (
      <div className="character-info">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading character information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-info">
        <div className="error-container">
          <h3>Error Loading Character</h3>
          <p>{error}</p>
          <button onClick={loadCharacterData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const skillStats = getSkillGroupStats();

  return (
    <div className="character-info">
      <div className="character-header">
        <h2>Character Information</h2>
      </div>

      {character && (
        <div className="character-content">
          {/* Basic Info Section */}
          <div className="info-section">
            <h3>Pilot Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{character.character_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">ID:</span>
                <span className="info-value">{character.character_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total SP:</span>
                <span className="info-value highlight">{formatSP(skillsData?.total_sp || 0)}</span>
              </div>
              {skillsData?.unallocated_sp && skillsData.unallocated_sp > 0 && (
                <div className="info-item">
                  <span className="info-label">Unallocated SP:</span>
                  <span className="info-value warning">{formatSP(skillsData.unallocated_sp)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attributes Section */}
          {attributes && (
            <div className="info-section">
              <h3>Attributes</h3>
              <div className="attributes-grid">
                <div className="attribute-item">
                  <div className="attribute-icon int">INT</div>
                  <div className="attribute-info">
                    <span className="attribute-name">Intelligence</span>
                    <span className="attribute-value">{attributes.intelligence}</span>
                  </div>
                </div>
                <div className="attribute-item">
                  <div className="attribute-icon mem">MEM</div>
                  <div className="attribute-info">
                    <span className="attribute-name">Memory</span>
                    <span className="attribute-value">{attributes.memory}</span>
                  </div>
                </div>
                <div className="attribute-item">
                  <div className="attribute-icon per">PER</div>
                  <div className="attribute-info">
                    <span className="attribute-name">Perception</span>
                    <span className="attribute-value">{attributes.perception}</span>
                  </div>
                </div>
                <div className="attribute-item">
                  <div className="attribute-icon wil">WIL</div>
                  <div className="attribute-info">
                    <span className="attribute-name">Willpower</span>
                    <span className="attribute-value">{attributes.willpower}</span>
                  </div>
                </div>
                <div className="attribute-item">
                  <div className="attribute-icon cha">CHA</div>
                  <div className="attribute-info">
                    <span className="attribute-name">Charisma</span>
                    <span className="attribute-value">{attributes.charisma}</span>
                  </div>
                </div>
              </div>
              
              <div className="remap-info">
                <div className="remap-item">
                  <span className="remap-label">Bonus Remaps:</span>
                  <span className="remap-value">{attributes.bonus_remaps || 0}</span>
                </div>
                <div className="remap-item">
                  <span className="remap-label">Next Remap:</span>
                  <span className="remap-value">{getRemapAvailability()}</span>
                </div>
                <div className="remap-item">
                  <span className="remap-label">Optimal Mapping:</span>
                  <span className="remap-value suggestion">{calculateOptimalMapping()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Skills Overview Section */}
          {skillsData && skillStats && (
            <div className="info-section">
              <h3>Skills Overview</h3>
              <div className="skills-overview">
                <div className="skill-stat-item">
                  <span className="stat-number">{skillStats.total}</span>
                  <span className="stat-label">Total Skills</span>
                </div>
                <div className="skill-stat-item highlight">
                  <span className="stat-number">{skillStats.level5}</span>
                  <span className="stat-label">Level V Skills</span>
                </div>
                <div className="skill-stat-item">
                  <span className="stat-number">{skillStats.level4}</span>
                  <span className="stat-label">Level IV Skills</span>
                </div>
              </div>
              
              <div className="skill-distribution">
                <h4>Skill Level Distribution</h4>
                <div className="distribution-bars">
                  {[5, 4, 3, 2, 1].map(level => {
                    const count = skillStats[`level${level}` as keyof typeof skillStats] as number;
                    const percentage = (count / skillStats.total) * 100;
                    
                    return (
                      <div key={level} className="distribution-item">
                        <span className="level-label">Level {level}</span>
                        <div className="distribution-bar">
                          <div 
                            className="bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="level-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Authentication Info */}
          <div className="info-section">
            <h3>Authentication</h3>
            <div className="auth-info">
              <div className="info-item">
                <span className="info-label">Token Expires:</span>
                <span className="info-value">{new Date(character.expires_on).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Scopes:</span>
                <span className="info-value small">{character.scopes}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="character-actions">
        <button onClick={loadCharacterData} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default CharacterInfo;