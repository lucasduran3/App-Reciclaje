/**
 * Header - Cabecera con información del usuario y logout
 * Ubicación: client/src/components/layout/Header.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="header-logo">
            <Icon icon="fluent-color:leaf-three-24" width="32" style={{ verticalAlign: 'middle' }} />
            {' '}Eco-Game
          </h1>
        </div>
        
        <div className="header-user">
          <div className="header-stats">
            <Badge variant="primary" icon={<Icon icon="fluent-color:star-48" />}>
              {currentUser.points} pts
            </Badge>
            <Badge variant="secondary" icon={<Icon icon="fluent-color:data-bar-vertical-ascending-24" />}>
              Nivel {currentUser.level}
            </Badge>
            {currentUser.streak > 0 && (
              <Badge variant="warning" icon={<Icon icon="fluent-emoji-flat:fire" />}>
                {currentUser.streak} días
              </Badge>
            )}
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}
            >
              <Avatar 
                src={currentUser.avatar} 
                alt={currentUser.name}
                size="medium"
              />
              <Icon 
                icon="fluent:chevron-down-24-filled" 
                width="16"
                style={{ color: 'white' }}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99
                  }}
                  onClick={() => setShowUserMenu(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + var(--spacing-sm))',
                  right: 0,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: '220px',
                  overflow: 'hidden',
                  zIndex: 100
                }}>
                  {/* User Info */}
                  <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ 
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '0.25rem'
                    }}>
                      {currentUser.name} {currentUser.lastName}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      @{currentUser.username}
                    </div>
                    {currentUser.role === 'sponsor' && (
                      <Badge 
                        variant="secondary" 
                        size="small"
                        style={{ marginTop: 'var(--spacing-xs)' }}
                      >
                        <Icon icon="fluent-color:building-bank-24" width="14" />
                        {' '}Patrocinador
                      </Badge>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        color: 'var(--text)',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Icon icon="fluent:person-24-filled" width="20" />
                      Mi Perfil
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Aquí iría la página de configuración
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        color: 'var(--text)',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Icon icon="fluent:settings-24-filled" width="20" />
                      Configuración
                    </button>

                    <div style={{
                      height: '1px',
                      background: 'var(--border)',
                      margin: 'var(--spacing-xs) 0'
                    }} />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        color: 'var(--danger)',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Icon icon="fluent:sign-out-24-filled" width="20" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}