/**
 * MapPicker Component - Interactive map to select location
 * client/src/components/tickets/MapPicker.jsx
 */

import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import geocodingService from "../../services/geocodingService";
import "leaflet/dist/leaflet.css";

// Componente para manejar clicks en el mapa
function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function MapPicker({
  onLocationSelect,
  initialPosition = null,
}) {
  // Centro por defecto: Rafaela, Santa Fe, Argentina
  const defaultCenter = initialPosition || {
    lat: -31.252,
    lng: -61.4867,
  };

  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);

  // Obtener dirección cuando se selecciona una ubicación
  useEffect(() => {
    if (selectedPosition) {
      loadAddress(selectedPosition);
    }
  }, [selectedPosition]);

  const loadAddress = async (position) => {
    setLoading(true);
    setError("");

    try {
      const location = await geocodingService.reverseGeocode(
        position.lat,
        position.lng
      );
      setAddress(location.address);
    } catch (err) {
      console.error("Error getting address:", err);
      setAddress(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    const position = {
      lat: latlng.lat,
      lng: latlng.lng,
    };
    setSelectedPosition(position);
  };

  const handleConfirm = () => {
    if (!selectedPosition) {
      setError("Selecciona una ubicación en el mapa");
      return;
    }

    onLocationSelect({
      coords: selectedPosition,
      address:
        address ||
        `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(
          6
        )}`,
    });
  };

  const handleUseMyLocation = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setSelectedPosition(newPosition);

        // Centrar el mapa en la nueva ubicación
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("No se pudo obtener tu ubicación");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="map-picker">
      {/* Instrucciones */}
      <div className="map-instructions">
        <Icon
          icon="fluent:info-24-filled"
          width="20"
          style={{ color: "var(--primary)" }}
        />
        <span>
          Haz click en el mapa para seleccionar la ubicación del punto sucio
        </span>
      </div>

      {/* Botón usar mi ubicación */}
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <Button
          type="button"
          variant="ghost"
          size="small"
          onClick={handleUseMyLocation}
          disabled={loading}
          icon={<Icon icon="fluent:my-location-24-filled" />}
        >
          Centrar en mi ubicación
        </Button>
      </div>

      {/* Mapa */}
      <div className="map-container-wrapper">
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={13}
          style={{
            height: "400px",
            width: "100%",
            borderRadius: "var(--radius)",
          }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker
            position={selectedPosition}
            onLocationSelect={handleMapClick}
          />
        </MapContainer>
      </div>

      {/* Dirección seleccionada */}
      {selectedPosition && (
        <div className="map-selected-location">
          <div className="map-selected-header">
            <Icon
              icon="fluent:location-24-filled"
              width="20"
              style={{ color: "var(--success)" }}
            />
            <span style={{ fontWeight: 600 }}>Ubicación seleccionada</span>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              <div
                className="spinner"
                style={{ width: "16px", height: "16px" }}
              />
              <span
                style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
              >
                Obteniendo dirección...
              </span>
            </div>
          ) : (
            <>
              <div className="map-selected-address">
                {address || "Cargando dirección..."}
              </div>
              <div className="map-selected-coords">
                📍 {selectedPosition.lat.toFixed(6)},{" "}
                {selectedPosition.lng.toFixed(6)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-alert" style={{ marginTop: "var(--spacing-md)" }}>
          <Icon icon="fluent:error-circle-24-filled" width="20" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón confirmar */}
      <Button
        type="button"
        variant="primary"
        fullWidth
        onClick={handleConfirm}
        disabled={!selectedPosition || loading}
        style={{ marginTop: "var(--spacing-md)" }}
        icon={<Icon icon="fluent:checkmark-24-filled" />}
      >
        Confirmar Ubicación
      </Button>
    </div>
  );
}
