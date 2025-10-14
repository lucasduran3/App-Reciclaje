import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export default function LeaderboardTable({ entries, loading }) {
  const { currentUser } = useAuth();

  if (loading) {
    return <div className="leaderboard-loading">Cargando ranking...</div>;
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🏆</span>
        <h3>No hay datos de ranking</h3>
      </div>
    );
  }

  const getMedalIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  return (
    <div className="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th className="col-position">#</th>
            <th className="col-user">Usuario</th>
            <th className="col-level">Nivel</th>
            <th className="col-points">Puntos</th>
            <th className="col-streak">Racha</th>
            <th className="col-zone">Zona</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const isCurrentUser = currentUser && entry.userId === currentUser.id;
            const medal = getMedalIcon(entry.position);

            return (
              <tr 
                key={entry.userId}
                className={isCurrentUser ? 'current-user-row' : ''}
              >
                <td className="col-position">
                  {medal || entry.position}
                </td>
                <td className="col-user">
                  <div className="user-cell">
                    <Avatar 
                      src={entry.avatar} 
                      alt={entry.name}
                      size="small"
                    />
                    <span className="user-name">
                      {entry.name}
                      {isCurrentUser && <Badge variant="primary" size="small">Tú</Badge>}
                    </span>
                  </div>
                </td>
                <td className="col-level">
                  <Badge variant="secondary">Nivel {entry.level}</Badge>
                </td>
                <td className="col-points">
                  <strong>{entry.points}</strong> pts
                </td>
                <td className="col-streak">
                  {entry.streak > 0 ? (
                    <Badge variant="warning" icon="🔥">
                      {entry.streak} días
                    </Badge>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="col-zone">
                  {entry.zone}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}