/**
 * LocationInput Component - 4 ways to input location (UPDATED WITH MAP)
 * client/src/components/tickets/LocationInput.jsx
 */

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import MapPicker from "./MapPicker";
import geocodingService from "../../services/geocodingService";

export default function LocationInput({ onLocationChange, error }) {
  const [method, setMethod] = useState("address");
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // Método 1: Ingresar dirección y geocodificar
  const handleAddressSubmit = async () => {
    if (!address || address.trim().length < 5) {
      setGeoError("Ingresa una dirección válida");
      return;
    }

    setLoading(true);
    setGeoError("");
    setSearchResults([]);

    try {
      const results = await geocodingService.geocode(address, {
        countryCode: "ar",
        limit: 5,
      });

      if (!results || results.length === 0) {
        setGeoError("No se encontró la dirección. Intenta ser más específico.");
        return;
      }

      if (results.length === 1) {
        selectLocation(results[0]);
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeoError("Error al buscar la dirección. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setSearchResults([]);
    onLocationChange(location);
  };

  // Método 2: Ingresar coordenadas manualmente
  const handleCoordsSubmit = async () => {
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);

    if (!geocodingService.validateCoordinates(lat, lng)) {
      setGeoError("Coordenadas inválidas. Verifica los valores.");
      return;
    }

    setLoading(true);
    setGeoError("");

    try {
      const location = await geocodingService.reverseGeocode(lat, lng);
      selectLocation(location);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      selectLocation({
        coords: { lat, lng },
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Método 3: Seleccionar en mapa
  const handleMapLocationSelect = (location) => {
    selectLocation(location);
  };

  // Método 4: Usar ubicación actual (GPS)
  const handleUseCurrentLocation = async () => {
    setLoading(true);
    setGeoError("");

    try {
      const location = await geocodingService.getCurrentLocation();
      selectLocation(location);
    } catch (error) {
      console.error("Geolocation error:", error);
      setGeoError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-input">
      {/* Selector de Método */}
      <div className="location-methods">
        <button
          type="button"
          className={`method-tab ${method === "address" ? "active" : ""}`}
          onClick={() => setMethod("address")}
        >
          <Icon icon="fluent:search-24-filled" width="20" />
          <span>Dirección</span>
        </button>
        <button
          type="button"
          className={`method-tab ${method === "coords" ? "active" : ""}`}
          onClick={() => setMethod("coords")}
        >
          <Icon icon="fluent:location-24-filled" width="20" />
          <span>Coordenadas</span>
        </button>
        <button
          type="button"
          className={`method-tab ${method === "map" ? "active" : ""}`}
          onClick={() => setMethod("map")}
        >
          <Icon icon="fluent:map-24-filled" width="20" />
          <span>Mapa</span>
        </button>
        <button
          type="button"
          className={`method-tab ${method === "gps" ? "active" : ""}`}
          onClick={() => setMethod("gps")}
        >
          <Icon icon="fluent:my-location-24-filled" width="20" />
          <span>GPS</span>
        </button>
      </div>

      {/* Contenido según método seleccionado */}
      <div className="location-method-content">
        {/* Método 1: Dirección */}
        {method === "address" && (
          <div className="method-content">
            <div className="form-group">
              <label className="form-label">Ingresa la dirección</label>
              <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: San Martín 123, Rafaela, Santa Fe"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddressSubmit())
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddressSubmit}
                  disabled={loading}
                  loading={loading}
                >
                  Buscar
                </Button>
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="search-results">
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginBottom: "var(--spacing-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Selecciona una ubicación:
                </p>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    className="search-result-item"
                    onClick={() => selectLocation(result)}
                  >
                    <Icon icon="fluent:location-24-filled" width="16" />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 500 }}>
                        {result.details.road || result.details.suburb}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {result.details.city}, {result.details.state}
                      </div>
                    </div>
                    <Icon
                      icon="fluent:chevron-right-24-filled"
                      width="16"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Método 2: Coordenadas */}
        {method === "coords" && (
          <div className="method-content">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={coords.lat}
                  onChange={(e) =>
                    setCoords((prev) => ({ ...prev, lat: e.target.value }))
                  }
                  placeholder="-31.4201"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={coords.lng}
                  onChange={(e) =>
                    setCoords((prev) => ({ ...prev, lng: e.target.value }))
                  }
                  placeholder="-62.0853"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={handleCoordsSubmit}
              disabled={loading || !coords.lat || !coords.lng}
              loading={loading}
              fullWidth
            >
              Confirmar Coordenadas
            </Button>
          </div>
        )}

        {/* Método 3: Mapa INTERACTIVO */}
        {method === "map" && (
          <div className="method-content">
            <MapPicker
              onLocationSelect={handleMapLocationSelect}
              initialPosition={selectedLocation?.coords}
            />
          </div>
        )}

        {/* Método 4: GPS */}
        {method === "gps" && (
          <div className="method-content">
            <div style={{ textAlign: "center", padding: "var(--spacing-lg)" }}>
              <Icon
                icon="fluent-color:location-live-24"
                width="64"
                style={{ marginBottom: "var(--spacing-md)" }}
              />
              <p
                style={{
                  marginBottom: "var(--spacing-lg)",
                  color: "var(--text-secondary)",
                }}
              >
                Usa tu ubicación actual para marcar el punto sucio
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={handleUseCurrentLocation}
                disabled={loading}
                loading={loading}
                icon={<Icon icon="fluent:my-location-24-filled" />}
              >
                {loading ? "Obteniendo ubicación..." : "Usar Mi Ubicación"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error de geocoding */}
      {geoError && (
        <div className="error-alert">
          <Icon icon="fluent:error-circle-24-filled" width="20" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="error-alert">
          <Icon icon="fluent:error-circle-24-filled" width="20" />
          <span>{error}</span>
        </div>
      )}

      {/* Ubicación seleccionada */}
      {selectedLocation && (
        <div className="selected-location">
          <div className="selected-location-header">
            <Icon
              icon="fluent:checkmark-circle-24-filled"
              width="24"
              style={{ color: "var(--success)" }}
            />
            <span>Ubicación confirmada</span>
          </div>
          <div className="selected-location-info">
            <div>
              <Icon icon="fluent:location-24-filled" width="16" />
              <span>{selectedLocation.address}</span>
            </div>
            <div className="coords-display">
              📍 {selectedLocation.coords.lat.toFixed(6)},{" "}
              {selectedLocation.coords.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
