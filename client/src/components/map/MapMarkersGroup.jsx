/**
 * MapMarkersGroup - Renderiza todos los marcadores de tickets
 * Ubicación: client/src/components/map/MapMarkersGroup.jsx
 */

import React, { useState, useCallback } from "react";
import { useMapEvents } from "react-leaflet";
import TicketMarker from "./TicketMarker";

export default function MapMarkersGroup({ tickets, onMarkerClick }) {
  const [currentZoom, setCurrentZoom] = useState(13);

  // Escuchar eventos del mapa para actualizar el zoom
  useMapEvents({
    zoomend: (e) => {
      setCurrentZoom(e.target.getZoom());
    },
  });

  const handleMarkerClick = useCallback(
    (ticket) => {
      if (onMarkerClick) {
        onMarkerClick(ticket);
      }
    },
    [onMarkerClick]
  );

  // Si no hay tickets, no renderizar nada
  if (!tickets || tickets.length === 0) {
    return null;
  }

  return (
    <>
      {tickets.map((ticket) => (
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
