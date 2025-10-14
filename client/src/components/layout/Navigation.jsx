import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navigation() {
  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/feed', label: 'Feed', icon: '📰' },
    { path: '/map', label: 'Mapa', icon: '🗺️' },
    { path: '/missions', label: 'Misiones', icon: '🎯' },
    { path: '/leaderboard', label: 'Ranking', icon: '🏆' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ];

  return (
    <nav className="navigation">
      <ul className="nav-list">
        {navItems.map(item => (
          <li key={item.path} className="nav-item">
            <NavLink 
              to={item.path} 
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}