import React from 'react';
import './CircularProgress.css';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  displayValue?: string;
  color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  displayValue,
  color = 'var(--color-primary)'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="circular-progress-svg"
      >
        {/* Background circle */}
        <circle
          className="progress-circle-bg"
          stroke="rgba(0, 212, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="progress-circle-fill"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="progress-content">
        {displayValue && (
          <div className="progress-value">{displayValue}</div>
        )}
        {label && (
          <div className="progress-label">{label}</div>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;