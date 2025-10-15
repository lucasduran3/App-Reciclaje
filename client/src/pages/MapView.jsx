import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../hooks/useTickets";
import { useApp } from "../context/AppContext";
import { Icon } from "@iconify/react";
import TicketFilters from "../components/tickets/TicketFilters";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

export default function MapView() {
  const navigate = useNavigate();
  const { appData } = useApp();
  const [filters, setFilters] = useState({});
  const { tickets, loading, refreshTickets } = useTickets(filters);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev };

      // Si el valor es null/undefined/empty string -> quitamos la clave
      if (value === null || value === undefined || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }

      return next;
    });
  };

  const statusConfig = {
    reported: {
      variant: "warning",
      label: "Reportado",
      icon: <Icon icon="fluent-color:megaphone-loud-32"></Icon>,
      color: "#f59e0b",
    },
    accepted: {
      variant: "info",
      label: "Aceptado",
      icon: <Icon icon="fluent-color:circle-multiple-hint-checkmark-48"></Icon>,
      color: "#3b82f6",
    },
    in_progress: {
      variant: "primary",
      label: "En progreso",
      icon: <Icon icon="fluent-color:arrow-clockwise-dashes-32"></Icon>,
      color: "#8b5cf6",
    },
    validating: {
      variant: "secondary",
      label: "Validando",
      icon: <Icon icon="fluent-color:people-sync-16"></Icon>,
      color: "#6366f1",
    },
    completed: {
      variant: "success",
      label: "Completado",
      icon: <Icon icon="fluent-color:checkmark-circle-48"></Icon>,
      color: "#10b981",
    },
    rejected: {
      variant: "danger",
      label: "Rechazado",
      icon: <Icon icon="fluent-color:dismiss-circle-32"></Icon>,
      color: "#ef4444",
    },
  };

  // Agrupar tickets por estado para estadísticas
  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Icon icon="fluent-emoji-flat:world-map"></Icon> Mapa Interactivo</h1>
          <p className="page-subtitle">
            Visualiza los puntos sucios en tiempo real
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="ghost" icon={<Icon icon="fluent-color:arrow-sync-16"></Icon>} onClick={refreshTickets}>
            Actualizar
          </Button>
          <Button
            variant="primary"
            icon={<Icon icon="fluent-color:megaphone-loud-32"></Icon>}
            onClick={() => navigate("/tickets/new")}
          >
            Reportar Nuevo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <TicketFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Estadísticas de tickets filtrados */}
      <div className="map-stats-bar">
        <div className="map-stats-summary">
          <span className="stats-total">
            <Icon icon="fluent-color:calendar-data-bar-16"></Icon> <strong>{tickets.length}</strong> ticket
            {tickets.length !== 1 ? "s" : ""} encontrado
            {tickets.length !== 1 ? "s" : ""}
          </span>

          {filters.status && (
            <Badge variant={statusConfig[filters.status]?.variant || "default"}>
              {statusConfig[filters.status]?.label || filters.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="map-container">
        {/* Sidebar con leyenda y estadísticas */}
        <div className="map-sidebar">
          <Card>
            <h3 className="card-title"><Icon icon="fluent-color:calendar-data-bar-16"></Icon> Estadísticas</h3>
            <div className="map-stats-detail">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = ticketsByStatus[status] || 0;
                return (
                  <div key={status} className="stat-item">
                    <div className="stat-item-header">
                      <Badge variant={config.variant} icon={config.icon}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="stat-item-value">{count}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h4>💡 Cómo usar el mapa</h4>
            <ul className="map-instructions">
              <li>📍 Cada marcador representa un ticket</li>
              <li>🎨 Los colores indican el estado</li>
              <li>🔍 Usa los filtros para buscar</li>
              <li>👆 Haz clic en un ticket para ver detalles</li>
            </ul>
          </Card>
        </div>

        {/* Vista del mapa */}
        <div className="map-view">
          {/* Placeholder para el mapa */}
          <div className="map-placeholder">
            <div className="map-placeholder-content">
              <span className="map-placeholder-icon">🗺️</span>
              <h3>Mapa Interactivo</h3>
              <p>Aquí se mostrará el mapa con react-leaflet</p>
              <div className="map-placeholder-markers">
                <p className="map-placeholder-note">
                  Simulación de marcadores:
                </p>
                <div className="placeholder-markers-grid">
                  {tickets.slice(0, 10).map((ticket) => {
                    const config = statusConfig[ticket.status];
                    return (
                      <div
                        key={ticket.id}
                        className="placeholder-marker"
                        style={{ backgroundColor: config.color }}
                        title={ticket.title}
                      >
                        {config.icon}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de tickets filtrados */}
        </div>
      </div>
    </div>
  );
}
