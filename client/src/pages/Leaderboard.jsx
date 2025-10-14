import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../context/AuthContext';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';

export default function Leaderboard() {
  const [selectedZone, setSelectedZone] = useState(null);
  const { leaderboard, loading, refreshLeaderboard } = useLeaderboard({
    zone: selectedZone,
    limit: 100,
  });
  const { currentUser } = useAuth();

  const zones = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];

  const currentUserEntry = leaderboard.find(
    entry => currentUser && entry.userId === currentUser.id
  );

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="page leaderboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Ranking</h1>
          <p className="page-subtitle">
            Compite con otros jugadores y escala posiciones
          </p>
        </div>
        <Button 
          variant="ghost" 
          icon="🔄"
          onClick={refreshLeaderboard}
        >
          Actualizar
        </Button>
      </div>

      {/* Zone Filters */}
      <div className="leaderboard-filters">
        <Button
          variant={selectedZone === null ? 'primary' : 'ghost'}
          onClick={() => setSelectedZone(null)}
        >
          🌎 Global
        </Button>
        {zones.map(zone => (
          <Button
            key={zone}
            variant={selectedZone === zone ? 'primary' : 'ghost'}
            onClick={() => setSelectedZone(zone)}
          >
            {zone}
          </Button>
        ))}
      </div>

      {/* Current User Position */}
      {currentUserEntry && (
        <Card className="current-user-card">
          <h3>Tu Posición</h3>
          <div className="current-user-position">
            <div className="position-rank">
              <span className="rank-number">#{currentUserEntry.position}</span>
              <span className="rank-label">de {leaderboard.length}</span>
            </div>
            <div className="position-details">
              <Avatar 
                src={currentUserEntry.avatar}
                alt={currentUserEntry.name}
                size="large"
              />
              <div className="position-info">
                <h4>{currentUserEntry.name}</h4>
                <div className="position-stats">
                  <Badge variant="primary">⭐ {currentUserEntry.points} pts</Badge>
                  <Badge variant="secondary">📊 Nivel {currentUserEntry.level}</Badge>
                  {currentUserEntry.streak > 0 && (
                    <Badge variant="warning">🔥 {currentUserEntry.streak} días</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="podium">
          {/* Second Place */}
          <Card className="podium-card podium-second">
            <div className="podium-medal">🥈</div>
            <Avatar src={top3[1].avatar} alt={top3[1].name} size="large" />
            <h4>{top3[1].name}</h4>
            <Badge variant="primary">{top3[1].points} pts</Badge>
          </Card>

          {/* First Place */}
          <Card className="podium-card podium-first">
            <div className="podium-medal">🥇</div>
            <Avatar src={top3[0].avatar} alt={top3[0].name} size="xlarge" />
            <h4>{top3[0].name}</h4>
            <Badge variant="primary">{top3[0].points} pts</Badge>
            <div className="podium-crown">👑</div>
          </Card>

          {/* Third Place */}
          <Card className="podium-card podium-third">
            <div className="podium-medal">🥉</div>
            <Avatar src={top3[2].avatar} alt={top3[2].name} size="large" />
            <h4>{top3[2].name}</h4>
            <Badge variant="primary">{top3[2].points} pts</Badge>
          </Card>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <h3 className="card-title">
          {selectedZone ? `Ranking de ${selectedZone}` : 'Ranking Global'}
        </h3>
        <LeaderboardTable 
          entries={leaderboard}
          loading={loading}
        />
      </Card>
    </div>
  );
}