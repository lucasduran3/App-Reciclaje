import React from 'react';

export default function Loader({ 
  size = 'medium',
  text,
  fullScreen = false 
}) {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large',
  };

  const containerClasses = [
    'loader-container',
    fullScreen && 'loader-fullscreen',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={`loader ${sizeClasses[size]}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}