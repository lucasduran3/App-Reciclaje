import React from 'react';

export default function ProgressBar({ 
  current, 
  max, 
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'medium'
}) {
  const percentage = Math.min(Math.round((current / max) * 100), 100);

  const sizeClasses = {
    small: 'progress-small',
    medium: 'progress-medium',
    large: 'progress-large',
  };

  return (
    <div className="progress-container">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showPercentage && (
            <span className="progress-percentage">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`progress ${sizeClasses[size]}`}>
        <div 
          className={`progress-bar progress-bar-${variant}`}
          style={{ width: `${percentage}%` }}
        >
          <span className="progress-text">{current}/{max}</span>
        </div>
      </div>
    </div>
  );
}