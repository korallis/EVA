import React, { useEffect, useState } from 'react';
import './CircularProgress.css';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  animated?: boolean;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'var(--primary-cyan)',
  backgroundColor = 'rgba(0, 212, 255, 0.1)',
  label,
  animated = true,
  className = '',
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timeout = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className={`circular-progress ${className}`}>
      <div className="progress-container" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="progress-svg"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
            className="progress-bg"
          />
          
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-circle"
            style={{
              '--progress-value': animatedValue,
              '--circumference': circumference,
            } as React.CSSProperties}
          />
          
          {/* Glow effect */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth / 2}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-glow"
            style={{
              '--progress-value': animatedValue,
              '--circumference': circumference,
            } as React.CSSProperties}
          />
        </svg>
        
        {/* Center content */}
        <div className="progress-content">
          <div className="progress-value text-h1">
            {Math.round(animatedValue)}%
          </div>
          {label && (
            <div className="progress-label text-small">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;