import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function Header() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="header-logo">🌱 Eco-Game</h1>
        </div>
        
        <div className="header-user">
          <div className="header-stats">
            <Badge variant="primary" icon="⭐">
              {currentUser.points} pts
            </Badge>
            <Badge variant="secondary" icon="📊">
              Nivel {currentUser.level}
            </Badge>
            {currentUser.streak > 0 && (
              <Badge variant="warning" icon="🔥">
                {currentUser.streak} días
              </Badge>
            )}
          </div>
          <Avatar 
            src={currentUser.avatar} 
            alt={currentUser.name}
            size="medium"
          />
        </div>
      </div>
    </header>
  );
}