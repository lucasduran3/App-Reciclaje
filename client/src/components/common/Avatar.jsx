import React from 'react';

export default function Avatar({ 
  src, 
  alt, 
  size = 'medium',
  badge,
  className = ''
}) {
  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large',
    xlarge: 'avatar-xlarge',
  };

  const classes = [
    'avatar',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <img src={src} alt={alt} className="avatar-img" />
      {badge && (
        <span className="avatar-badge">{badge}</span>
      )}
    </div>
  );
}