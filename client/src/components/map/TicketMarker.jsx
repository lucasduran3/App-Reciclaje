/**
 * TicketMarker - Marcador individual para tickets en el mapa
 * Ubicación: client/src/components/map/TicketMarker.jsx
 */

import React, { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Icon } from "@iconify/react";

// Configuración de estados
const STATUS_CONFIG = {
  reported: {
    color: "#f59e0b",
    icon: "fluent-color:megaphone-loud-32",
  },
  accepted: {
    color: "#3b82f6",
    icon: "fluent-color:circle-multiple-hint-checkmark-48",
  },
  in_progress: {
    color: "#8b5cf6",
    icon: "fluent-color:arrow-clockwise-dashes-32",
  },
  validating: {
    color: "#6366f1",
    icon: "fluent-color:people-sync-16",
  },
  completed: {
    color: "#10b981",
    icon: "fluent-color:checkmark-circle-48",
  },
  rejected: {
    color: "#ef4444",
    icon: "fluent-color:dismiss-circle-32",
  },
};

/**
 * Parsea coordenadas desde formato PostGIS point
 * Formato: "(lat,lng)" o "POINT(lng lat)"
 */
function parseCoordinates(location) {
  if (!location) return null;

  // Si ya es un objeto con lat/lng
  if (typeof location === "object" && location.lat && location.lng) {
    return [parseFloat(location.lat), parseFloat(location.lng)];
  }

  // Si es string en formato "(lat,lng)"
  if (typeof location === "string") {
    // Formato: "(lat,lng)"
    const match = location.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }

    // Formato: "POINT(lng lat)" - PostGIS estándar
    const pointMatch = location.match(/POINT\(([^\s]+)\s+([^)]+)\)/);
    if (pointMatch) {
      // PostGIS usa lng,lat pero Leaflet usa lat,lng
      return [parseFloat(pointMatch[2]), parseFloat(pointMatch[1])];
    }
  }

  return null;
}

/**
 * Crea un icono personalizado para el marcador
 */
function createCustomIcon(status, priority = "medium") {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.reported;
  const isUrgent = priority === "urgent";

  // Crear HTML del icono con el ícono de Iconify
  const iconHtml = `
    <div class="custom-marker" style="
      background-color: ${config.color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
      ${isUrgent ? "animation: pulse 2s infinite;" : ""}
    ">
      <span style="font-size: 20px; filter: brightness(1.2);">
        ${renderToString(<Icon icon={config.icon} width="20" />)}
      </span>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker-wrapper",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export default function TicketMarker({ ticket, onClick, currentZoom = 13 }) {
  // Parsear coordenadas
  const position = useMemo(() => {
    return parseCoordinates(ticket.location);
  }, [ticket.location]);

  // Crear icono personalizado
  const icon = useMemo(() => {
    return createCustomIcon(ticket.status, ticket.priority);
  }, [ticket.status, ticket.priority]);

  // No renderizar si no hay coordenadas válidas
  if (!position) {
    console.warn(
      `Ticket ${ticket.id} no tiene coordenadas válidas:`,
      ticket.location
    );
    return null;
  }

  // Mostrar tooltip solo si el zoom es suficiente
  const showTooltip = currentZoom >= 15;

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(ticket),
      }}
    >
      {showTooltip && (
        <Tooltip direction="top" offset={[0, -20]} permanent={false}>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              maxWidth: "200px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ticket.title}
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}

// CSS para la animación de pulse (agregar al Map.css)
const pulseAnimation = `
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
`;
