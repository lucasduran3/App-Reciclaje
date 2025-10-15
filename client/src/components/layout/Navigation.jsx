import React from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';

export default function Navigation() {
  const navItems = [
    { path: '/', label: 'Inicio', icon: <Icon icon ="fluent-color:home-48"/> },
    { path: '/feed', label: 'Feed', icon: <Icon icon ="fluent-color:news-28"></Icon>},
    { path: '/map', label: 'Mapa', icon: <Icon icon ="fluent-emoji-flat:world-map" /> },
    { path: '/missions', label: 'Misiones', icon: <Icon icon="fluent-color:pin-24"></Icon>},
    { path: '/leaderboard', label: 'Ranking', icon: <Icon icon="fluent-color:trophy-24"></Icon> },
    { path: '/profile', label: 'Perfil', icon: <Icon icon="fluent-color:person-24"></Icon> },
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