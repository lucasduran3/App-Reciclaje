/**
 * MapLegend - Leyenda para el mapa
 * Ubicación: client/src/components/map/MapLegend.jsx
 */

import React from "react";
import { Icon } from "@iconify/react";
import Badge from "../common/Badge";

const STATUS_CONFIG = {
  reported: {
    variant: "warning",
    label: "Reportado",
    icon: <Icon icon="fluent-color:megaphone-loud-32" />,
    color: "#f59e0b",
  },
  accepted: {
    variant: "info",
    label: "Aceptado",
    icon: <Icon icon="fluent-color:circle-multiple-hint-checkmark-48" />,
    color: "#3b82f6",
  },
  in_progress: {
    variant: "primary",
    label: "En progreso",
    icon: <Icon icon="fluent-color:arrow-clockwise-dashes-32" />,
    color: "#8b5cf6",
  },
  validating: {
    variant: "secondary",
    label: "Validando",
    icon: <Icon icon="fluent-color:people-sync-16" />,
    color: "#6366f1",
  },
  completed: {
    variant: "success",
    label: "Completado",
    icon: <Icon icon="fluent-color:checkmark-circle-48" />,
    color: "#10b981",
  },
  rejected: {
    variant: "danger",
    label: "Rechazado",
    icon: <Icon icon="fluent-color:dismiss-circle-32" />,
    color: "#ef4444",
  },
};

export default function MapLegend({ ticketsByStatus }) {
  return (
    <div className="map-legend">
      <h4>
        <Icon icon="fluent-color:info-24" width="20" /> Estados
      </h4>
      <div className="legend-items">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = ticketsByStatus[status] || 0;
          return (
            <div key={status} className="legend-item">
              <div
                className="legend-marker"
                style={{ backgroundColor: config.color }}
              />
              <span className="legend-label">{config.label}</span>
              <span className="legend-count">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
