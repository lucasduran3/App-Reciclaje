import React from 'react';
import MissionCard from './MissionCard';
import Loader from '../common/Loader';

export default function MissionList({ missions, loading, filter = 'all' }) {
  if (loading) {
    return <Loader text="Cargando misiones..." />;
  }

  let filteredMissions = missions || [];

  if (filter === 'active') {
    filteredMissions = filteredMissions.filter(m => !m.completed);
  } else if (filter === 'completed') {
    filteredMissions = filteredMissions.filter(m => m.completed);
  } else if (filter === 'daily') {
    filteredMissions = filteredMissions.filter(m => m.type === 'daily');
  } else if (filter === 'weekly') {
    filteredMissions = filteredMissions.filter(m => m.type === 'weekly');
  }

  if (filteredMissions.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎯</span>
        <h3>No hay misiones disponibles</h3>
        <p>Las nuevas misiones aparecerán pronto</p>
      </div>
    );
  }

  return (
    <div className="mission-list">
      {filteredMissions.map(mission => (
        <MissionCard key={mission.id} mission={mission} />
      ))}
    </div>
  );
}