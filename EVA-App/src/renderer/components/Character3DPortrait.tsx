import React, { useState, useEffect, useRef } from 'react';
import './Character3DPortrait.css';

interface Character3DPortraitProps {
  characterId?: number;
  characterName?: string;
  size?: 'small' | 'medium' | 'large';
  showHologram?: boolean;
}

const Character3DPortrait: React.FC<Character3DPortraitProps> = ({
  characterId,
  characterName,
  size = 'large',
  showHologram = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const portraitRef = useRef<HTMLDivElement>(null);

  const sizeMap = {
    small: 80,
    medium: 120,
    large: 200
  };

  const portraitSize = sizeMap[size];
  const imageUrl = characterId ? `https://images.evetech.net/characters/${characterId}/portrait?size=512` : null;

  useEffect(() => {
    // Reset states when character changes
    setImageLoaded(false);
    setImageError(false);
  }, [characterId]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const renderHologram = () => (
    <div className="hologram-container">
      <div className="hologram-core">
        <div className="hologram-face">
          <div className="hologram-eyes">
            <div className="hologram-eye left"></div>
            <div className="hologram-eye right"></div>
          </div>
          <div className="hologram-mouth"></div>
        </div>
        <div className="hologram-body">
          <div className="hologram-chest"></div>
          <div className="hologram-shoulders">
            <div className="shoulder left"></div>
            <div className="shoulder right"></div>
          </div>
        </div>
      </div>
      
      {/* Holographic scan lines */}
      <div className="scan-lines">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="scan-line" style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>
      
      {/* Energy field */}
      <div className="energy-field">
        <div className="energy-ring ring-1"></div>
        <div className="energy-ring ring-2"></div>
        <div className="energy-ring ring-3"></div>
      </div>
      
      {/* Data streams */}
      <div className="data-streams">
        {Array.from({ length: 12 }, (_, i) => (
          <div 
            key={i} 
            className="data-particle" 
            style={{ 
              animationDelay: `${i * 0.3}s`,
              transform: `rotate(${i * 30}deg)`
            }}
          ></div>
        ))}
      </div>
      
      {/* Hologram text */}
      <div className="hologram-text">
        <div className="text-line">GIDEON AI ASSISTANT</div>
        <div className="text-line">AWAITING USER DATA</div>
        <div className="text-line">EVA SYSTEM READY</div>
      </div>
    </div>
  );

  const renderCharacterPortrait = () => (
    <div className="character-portrait-container">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={characterName || 'Character Portrait'}
          className={`character-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageError ? 'none' : 'block' }}
        />
      )}
      
      {/* 3D enhancement overlay */}
      <div className="portrait-3d-overlay">
        <div className="depth-layer layer-1"></div>
        <div className="depth-layer layer-2"></div>
        <div className="depth-layer layer-3"></div>
      </div>
      
      {/* Glowing border */}
      <div className="portrait-glow"></div>
      
      {/* EVE-style HUD elements */}
      <div className="hud-elements">
        <div className="hud-corner top-left"></div>
        <div className="hud-corner top-right"></div>
        <div className="hud-corner bottom-left"></div>
        <div className="hud-corner bottom-right"></div>
        <div className="hud-line horizontal top"></div>
        <div className="hud-line horizontal bottom"></div>
        <div className="hud-line vertical left"></div>
        <div className="hud-line vertical right"></div>
      </div>
      
      {/* Status indicator */}
      <div className="status-indicator">
        <div className="status-dot online"></div>
        <div className="status-text">ONLINE</div>
      </div>
      
      {/* Character info overlay */}
      {characterName && (
        <div className="character-info-overlay">
          <div className="character-name">{characterName}</div>
          <div className="character-status">PILOT AUTHENTICATED</div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      ref={portraitRef}
      className={`character-3d-portrait ${size} ${showHologram || !characterId || imageError ? 'hologram-mode' : 'character-mode'}`}
      style={{ 
        width: portraitSize, 
        height: portraitSize 
      }}
    >
      {showHologram || !characterId || imageError ? renderHologram() : renderCharacterPortrait()}
      
      {/* Ambient particles */}
      <div className="ambient-particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div 
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Character3DPortrait;