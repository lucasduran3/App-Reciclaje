import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';

export default function MissionCard({ mission }) {
  const typeColors = {
    daily: 'primary',
    weekly: 'secondary',
    special: 'warning',
  };

  const typeLabels = {
    daily: 'Diaria',
    weekly: 'Semanal',
    special: 'Especial',
  };

  const isExpired = mission.expiresAt && new Date(mission.expiresAt) < new Date();
  const timeLeft = mission.expiresAt ? getTimeLeft(mission.expiresAt) : null;

  return (
    <Card className={`mission-card ${mission.completed ? 'mission-completed' : ''}`}>
      <div className="mission-card-header">
        <span className="mission-icon">{mission.icon}</span>
        <div className="mission-badges">
          <Badge variant={typeColors[mission.type]}>
            {typeLabels[mission.type]}
          </Badge>
          {mission.completed && (
            <Badge variant="success" icon="✅">Completada</Badge>
          )}
          {isExpired && !mission.completed && (
            <Badge variant="danger" icon="⏰">Expirada</Badge>
          )}
        </div>
      </div>

      <h3 className="mission-title">{mission.title}</h3>
      <p className="mission-description">{mission.description}</p>

      <ProgressBar 
        current={mission.progress}
        max={mission.goal}
        variant={mission.completed ? 'success' : 'primary'}
        label="Progreso"
      />

      <div className="mission-footer">
        <div className="mission-reward">
          <span className="mission-points">⭐ {mission.points} puntos</span>
        </div>
        {timeLeft && !mission.completed && (
          <div className="mission-time">
            <span className="mission-timer">⏰ {timeLeft}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function getTimeLeft(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff < 0) return 'Expirada';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} día${days > 1 ? 's' : ''}`;
  }

  return `${hours}h ${minutes}m`;
}