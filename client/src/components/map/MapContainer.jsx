/**
 * MapContainer - Componente base del mapa con Leaflet
 * Ubicación: client/src/components/map/MapContainer.jsx
 */

import React from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Coordenadas de Rafaela, Santa Fe, Argentina
const RAFAELA_CENTER = [-31.2527, -61.4867];
const DEFAULT_ZOOM = 13;
const MIN_ZOOM = 11;
const MAX_ZOOM = 18;

export default function MapContainer({
  children,
  center = RAFAELA_CENTER,
  zoom = DEFAULT_ZOOM,
}) {
  return (
    <LeafletMap
      center={center}
      zoom={zoom}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomControl={false} // Deshabilitamos el control por defecto
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "var(--radius-lg)",
        zIndex: 0,
      }}
      className="leaflet-map"
    >
      {/* Capa de tiles - Usando OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={MAX_ZOOM}
      />

      {/* Control de zoom personalizado (esquina inferior derecha) */}
      <ZoomControl position="bottomright" />

      {/* Aquí se renderizarán los marcadores y otros elementos */}
      {children}
    </LeafletMap>
  );
}
