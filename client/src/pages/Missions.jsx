import React, { useState } from 'react';
import { useMissions } from '../hooks/useMissions';
import MissionList from '../components/missions/MissionList';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Missions() {
  const [filter, setFilter] = useState('active');
  const { missions, loading, refreshMissions } = useMissions();

  const filterOptions = [
    { value: 'all', label: 'Todas', icon: '📋' },
    { value: 'active', label: 'Activas', icon: '🎯' },
    { value: 'completed', label: 'Completadas', icon: '✅' },
    { value: 'daily', label: 'Diarias', icon: '📅' },
    { value: 'weekly', label: 'Semanales', icon: '📆' },
  ];

  const activeMissions = missions.filter(m => !m.completed);
  const completedMissions = missions.filter(m => m.completed);
  const totalPoints = missions.reduce((sum, m) => 
    m.completed ? sum + m.points : sum, 0
  );

  return (
    <div className="page missions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Misiones</h1>
          <p className="page-subtitle">
            Completa misiones para ganar puntos extra y subir de nivel
          </p>
        </div>
        <Button 
          variant="ghost" 
          icon="🔄"
          onClick={refreshMissions}
        >
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="missions-stats">
        <Card className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{activeMissions.length}</div>
            <div className="stat-label">Activas</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{completedMissions.length}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{totalPoints}</div>
            <div className="stat-label">Puntos Ganados</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="missions-filters">
        {filterOptions.map(option => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'primary' : 'ghost'}
            icon={option.icon}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Missions List */}
      <MissionList 
        missions={missions}
        loading={loading}
        filter={filter}
      />
    </div>
  );
}