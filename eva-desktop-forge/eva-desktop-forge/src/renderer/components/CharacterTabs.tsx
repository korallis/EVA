import React, { useState, useEffect } from 'react';
import './CharacterTabs.css';

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

interface CharacterTabsProps {
  characters: Character[];
  activeCharacterId: number | null;
  onCharacterSelect: (characterId: number) => void;
  onCharacterClose: (characterId: number) => void;
  onAddCharacter: () => void;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({
  characters,
  activeCharacterId,
  onCharacterSelect,
  onCharacterClose,
  onAddCharacter
}) => {
  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  const [dragOverTab, setDragOverTab] = useState<number | null>(null);

  // Calculate training time remaining
  const getTrainingTimeRemaining = (endTime: string | undefined): string => {
    if (!endTime) return '';
    
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

  // Get corporation logo URL
  const getCorporationLogo = (corpId: number | undefined): string => {
    if (!corpId) return '';
    return `https://images.evetech.net/corporations/${corpId}/logo?size=32`;
  };

  // Handle tab drag start
  const handleDragStart = (e: React.DragEvent, characterId: number) => {
    setDraggedTab(characterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, characterId: number) => {
    e.preventDefault();
    setDragOverTab(characterId);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetCharacterId: number) => {
    e.preventDefault();
    
    if (draggedTab && draggedTab !== targetCharacterId) {
      // Reorder characters - this would trigger parent component reordering
      console.log(`Reorder character ${draggedTab} to position of ${targetCharacterId}`);
    }
    
    setDraggedTab(null);
    setDragOverTab(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  return (
    <div className="character-tabs-container">
      <div className="character-tabs">
        {characters.map((character) => (
          <div
            key={character.character_id}
            className={`character-tab ${
              activeCharacterId === character.character_id ? 'active' : ''
            } ${draggedTab === character.character_id ? 'dragging' : ''} ${
              dragOverTab === character.character_id ? 'drag-over' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, character.character_id)}
            onDragOver={(e) => handleDragOver(e, character.character_id)}
            onDrop={(e) => handleDrop(e, character.character_id)}
            onDragEnd={handleDragEnd}
            onClick={() => onCharacterSelect(character.character_id)}
          >
            {/* Tab Favicon - Character Portrait */}
            <div className="tab-favicon">
              <img
                src={`https://images.evetech.net/characters/${character.character_id}/portrait?size=32`}
                alt=""
                className="character-favicon"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('favicon-error');
                }}
              />
              <div className="character-favicon-placeholder">
                <span>{character.character_name.charAt(0)}</span>
              </div>
              
              {/* Corporation Logo Overlay */}
              {character.corporation_id && (
                <div className="corp-logo-overlay">
                  <img
                    src={getCorporationLogo(character.corporation_id)}
                    alt=""
                    className="corp-logo"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}
              
              {/* Training Status Indicator */}
              {character.training_active && (
                <div className="training-indicator">
                  <div className="training-dot pulsing"></div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              <div className="tab-title">
                {character.character_name}
              </div>
              
              {/* Training Status */}
              {character.training_active && character.training_skill_name && (
                <div className="tab-subtitle">
                  {character.training_skill_name} - {getTrainingTimeRemaining(character.training_end_time)}
                </div>
              )}
              
              {/* Corporation Name */}
              {!character.training_active && character.corporation_name && (
                <div className="tab-subtitle">
                  {character.corporation_name}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div 
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCharacterClose(character.character_id);
              }}
            >
              ×
            </div>

            {/* Tab Status Indicators */}
            <div className="tab-indicators">
              {/* Connection Status */}
              <div className={`connection-status ${character.last_updated ? 'connected' : 'disconnected'}`}>
              </div>
              
              {/* Training Progress Bar */}
              {character.training_active && character.training_end_time && (
                <div className="training-progress">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, Math.max(0, 
                        100 - (new Date(character.training_end_time).getTime() - Date.now()) / 
                        (24 * 60 * 60 * 1000) * 100
                      ))}%`
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Character Tab */}
        <div className="character-tab add-tab" onClick={onAddCharacter}>
          <div className="add-icon">+</div>
          <div className="add-text">Add Character</div>
        </div>
      </div>

      {/* Tab Overflow Menu */}
      {characters.length > 5 && (
        <div className="tab-overflow-menu">
          <div className="overflow-button">
            <span>⋯</span>
          </div>
          <div className="overflow-dropdown">
            {characters.slice(5).map((character) => (
              <div
                key={character.character_id}
                className="overflow-item"
                onClick={() => onCharacterSelect(character.character_id)}
              >
                <img
                  src={`https://images.evetech.net/characters/${character.character_id}/portrait?size=24`}
                  alt=""
                  className="overflow-portrait"
                />
                <span>{character.character_name}</span>
                {character.training_active && <div className="overflow-training-dot"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterTabs;