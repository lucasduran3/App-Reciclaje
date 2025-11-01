/**
 * Header - Cabecera con información del usuario y logout
 * Ubicación: client/src/components/layout/Header.jsx
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";

export default function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="header-logo">
            <Icon
              icon="fluent-color:leaf-three-24"
              width="32"
              style={{ verticalAlign: "middle" }}
            />{" "}
            Eco-Game
          </h1>
        </div>

        <div className="header-user">
          <div className="header-stats">
            <Badge
              variant="primary"
              icon={<Icon icon="fluent-color:star-48" />}
            >
              {currentUser.points} pts
            </Badge>
            <Badge
              variant="secondary"
              icon={<Icon icon="fluent-color:data-bar-vertical-ascending-24" />}
            >
              Nivel {currentUser.level}
            </Badge>
            {currentUser.streak > 0 && (
              <Badge
                variant="warning"
                icon={<Icon icon="fluent-emoji-flat:fire" />}
              >
                {currentUser.streak} días
              </Badge>
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu">
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-label="Menú de usuario"
            >
              <Avatar
                src={currentUser.avatar}
                alt={currentUser.name}
                size="medium"
              />
              <Icon
                icon="fluent:chevron-down-24-filled"
                width="16"
                className="chevron-icon"
              />
            </button>

            {/* Dropdown Overlay (cierra el menú al hacer clic fuera) */}
            {showUserMenu && (
              <div
                className="dropdown-overlay"
                onClick={() => setShowUserMenu(false)}
              />
            )}

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="dropdown-menu">
                {/* User Info */}
                <div className="user-info">
                  <div className="user-info-name">
                    {currentUser.name} {currentUser.last_name}
                  </div>
                  <div className="user-info-username">
                    @{currentUser.username}
                  </div>
                  {currentUser.role === "sponsor" && (
                    <Badge
                      variant="secondary"
                      size="small"
                      className="sponsor-badge"
                    >
                      <Icon icon="fluent-color:building-bank-24" width="14" />
                      Patrocinador
                    </Badge>
                  )}
                </div>

                {/* Menu Items */}
                <div className="menu-items">
                  <button
                    className="option-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/profile");
                    }}
                  >
                    <Icon icon="fluent:person-24-filled" width="20" />
                    <span>Mi Perfil</span>
                  </button>

                  <button
                    className="option-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      // Aquí iría la página de configuración
                    }}
                  >
                    <Icon icon="fluent:settings-24-filled" width="20" />
                    <span>Configuración</span>
                  </button>

                  <div className="menu-divider" />

                  <button
                    className="option-btn option-btn-danger"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    <Icon icon="fluent:sign-out-24-filled" width="20" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
