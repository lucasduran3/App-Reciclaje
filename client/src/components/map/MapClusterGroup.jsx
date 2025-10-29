/**
 * MapClusterGroup - Componente de clustering optimizado
 * Ubicación: client/src/components/map/MapClusterGroup.jsx
 */

import React, { useMemo, useState, useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import TicketMarker from "./TicketMarker";
import L from "leaflet";

// Configuración de colores por estado
const STATUS_COLORS = {
  reported: "#f59e0b",
  accepted: "#3b82f6",
  in_progress: "#8b5cf6",
  validating: "#6366f1",
  completed: "#10b981",
  rejected: "#ef4444",
};

/**
 * Crea un icono personalizado para clusters
 * El color dominante depende del estado más común en el cluster
 */
function createClusterCustomIcon(cluster) {
  const childCount = cluster.getChildCount();
  const markers = cluster.getAllChildMarkers();

  // Contar tickets por estado
  const statusCounts = markers.reduce((acc, marker) => {
    const status = marker.options.ticketStatus || "reported";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Obtener el estado más común
  const dominantStatus =
    Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "reported";

  const color = STATUS_COLORS[dominantStatus];

  // Determinar tamaño del cluster según cantidad
  let size = "small";
  if (childCount >= 10 && childCount < 50) size = "medium";
  else if (childCount >= 50) size = "large";

  const dimensions = {
    small: 40,
    medium: 50,
    large: 60,
  };

  const dim = dimensions[size];

  return L.divIcon({
    html: `
      <div class="marker-cluster-custom" style="
        width: ${dim}px;
        height: ${dim}px;
        background-color: ${color};
        border: 4px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: bold;
        color: white;
        font-size: ${size === "large" ? "1.25rem" : "1rem"};
      ">
        ${childCount}
      </div>
    `,
    className: "marker-cluster-wrapper",
    iconSize: L.point(dim, dim),
  });
}

export default function MapClusterGroup({
  tickets,
  onMarkerClick,
  enableClustering = true,
}) {
  const [currentZoom, setCurrentZoom] = useState(13);
  const [mapBounds, setMapBounds] = useState(null);

  // Escuchar eventos del mapa
  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
    moveend: () => {
      setMapBounds(map.getBounds());
    },
  });

  // Filtrar tickets que están dentro del viewport (optimización)
  const visibleTickets = useMemo(() => {
    if (!mapBounds) return tickets;

    // Si hay pocos tickets, no filtrar
    if (tickets.length < 100) return tickets;

    return tickets.filter((ticket) => {
      const coords = parseCoordinates(ticket.location);
      if (!coords) return false;

      const [lat, lng] = coords;
      return mapBounds.contains([lat, lng]);
    });
  }, [tickets, mapBounds]);

  // Determinar si usar clustering según zoom y cantidad
  const shouldCluster = useMemo(() => {
    if (!enableClustering) return false;

    // Si hay menos de 20 tickets, no agrupar
    if (visibleTickets.length < 20) return false;

    // Si el zoom es muy alto (>16), no agrupar
    if (currentZoom > 16) return false;

    return true;
  }, [enableClustering, visibleTickets.length, currentZoom]);

  const handleMarkerClick = useCallback(
    (ticket) => {
      if (onMarkerClick) {
        onMarkerClick(ticket);
      }
    },
    [onMarkerClick]
  );

  // Si no hay tickets, no renderizar nada
  if (!visibleTickets || visibleTickets.length === 0) {
    return null;
  }

  // Renderizar con clustering
  if (shouldCluster) {
    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        iconCreateFunction={createClusterCustomIcon}
      >
        {visibleTickets.map((ticket) => (
          <TicketMarker
            key={ticket.id}
            ticket={ticket}
            onClick={handleMarkerClick}
            currentZoom={currentZoom}
          />
        ))}
      </MarkerClusterGroup>
    );
  }

  // Renderizar sin clustering (para zoom alto o pocos tickets)
  return (
    <>
      {visibleTickets.map((ticket) => (
        <TicketMarker
          key={ticket.id}
          ticket={ticket}
          onClick={handleMarkerClick}
          currentZoom={currentZoom}
        />
      ))}
    </>
  );
}

/**
 * Helper: parsea coordenadas (duplicado de TicketMarker para evitar dependencia)
 */
function parseCoordinates(location) {
  if (!location) return null;

  if (typeof location === "object" && location.lat && location.lng) {
    return [parseFloat(location.lat), parseFloat(location.lng)];
  }

  if (typeof location === "string") {
    const match = location.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }

    const pointMatch = location.match(/POINT\(([^\s]+)\s+([^)]+)\)/);
    if (pointMatch) {
      return [parseFloat(pointMatch[2]), parseFloat(pointMatch[1])];
    }
  }

  return null;
}
