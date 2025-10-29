/**
 * Geocoding Service - Address <-> Coordinates conversion
 * client/src/services/geocodingService.js
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// User-Agent requerido por Nominatim
const HEADERS = {
  "User-Agent": "EcoGame/1.0",
};

const DEFAULT_CITY_NAME = "Rafaela, Santa Fe, Argentina";
const DEFAULT_CITY_POSTCODE = "2300";

// Cache simple en memoria para no pedir el bbox cada vez
let cityViewboxCache = null;

class GeocodingService {
  // Helper: obtiene el viewbox (xmin,ymin,xmax,ymax) para una ciudad usando Nominatim (cached)
  async getCityViewbox(cityName = DEFAULT_CITY_NAME, countryCode = "ar") {
    try {
      if (cityViewboxCache) return cityViewboxCache;

      const params = new URLSearchParams({
        q: cityName,
        format: "json",
        limit: "1",
        addressdetails: "1",
        ...(countryCode && { countrycodes: countryCode }),
      });

      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: HEADERS,
      });

      if (!response.ok) {
        console.warn("No se pudo obtener bounding box de la ciudad, status:", response.status);
        return null;
      }

      const data = await response.json();
      if (!data || !data[0] || !data[0].boundingbox) return null;

      // Nominatim devuelve boundingbox como [southLat, northLat, westLon, eastLon]
      const bb = data[0].boundingbox.map((v) => parseFloat(v));
      const minLat = bb[0];
      const maxLat = bb[1];
      const minLon = bb[2];
      const maxLon = bb[3];

      // viewbox para la query: xmin,ymin,xmax,ymax  -> minLon,minLat,maxLon,maxLat
      cityViewboxCache = `${minLon},${minLat},${maxLon},${maxLat}`;
      return cityViewboxCache;
    } catch (err) {
      console.warn("Error al obtener viewbox de la ciudad:", err);
      return null;
    }
  }

  /**
   * Convierte dirección a coordenadas (Geocoding)
   * @param {string} address - Dirección a buscar
   * @param {object} options - Opciones adicionales:
   *    - countryCode (default "ar")
   *    - limit (default 5)
   *    - language (default "es")
   *    - restrictToCity (default true) -> si true intenta limitar a Rafaela
   *    - cityName (default "Rafaela, Santa Fe, Argentina")
   *    - postalCode (default "2300")
   * @returns {Promise<Array>} Array de resultados con coords y display_name
   */
  async geocode(address, options = {}) {
    try {
      const {
        countryCode = "ar", // Limitar a Argentina por defecto
        limit = 5,
        language = "es",
        restrictToCity = true,
        cityName = DEFAULT_CITY_NAME,
        postalCode = DEFAULT_CITY_POSTCODE,
      } = options;

      const params = new URLSearchParams({
        q: address,
        format: "json",
        limit: limit.toString(),
        addressdetails: "1",
        ...(countryCode && { countrycodes: countryCode }),
        ...(language && { "accept-language": language }),
      });

      // Si pedimos restricción por ciudad, intentar obtener viewbox y aplicar viewbox+bounded=1
      if (restrictToCity) {
        const viewbox = await this.getCityViewbox(cityName, countryCode).catch(() => null);
        if (viewbox) {
          params.append("viewbox", viewbox);
          params.append("bounded", "1"); // fuerza a devolver solo resultados dentro del viewbox.
        } else {
          // Si no conseguimos viewbox, no abortamos la búsqueda: se hace la búsqueda normal
          console.warn("No se aplicó viewbox (no se obtuvo boundingbox de la ciudad)");
        }
      }

      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: HEADERS,
      });

      if (!response.ok) {
        throw new Error("Error en la búsqueda de dirección");
      }

      const data = await response.json();

      const mapped = data.map((result) => ({
        coords: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
        address: result.display_name,
        details: {
          road: result.address?.road,
          houseNumber: result.address?.house_number,
          suburb: result.address?.suburb,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country,
          postcode: result.address?.postcode,
        },
        boundingBox: result.boundingbox,
        importance: result.importance,
      }));

      // Si pedimos restricción, aplicamos un filtro cliente adicional (postcode/city/display_name)
      if (restrictToCity) {
        const filtered = mapped.filter((r) => {
          const pc = r.details.postcode;
          const city = (r.details.city || "").toString().toLowerCase();
          const inDisplay = (r.address || "").toLowerCase().includes((cityName || "rafaela").toLowerCase().split(",")[0]);
          return pc === postalCode || city === "rafaela" || inDisplay;
        });

        // Si el filtro devuelve algo, lo retornamos. Si queda vacío, devolvemos los resultados originales
        if (filtered.length > 0) {
          return filtered;
        } else {
          console.warn(
            `Búsqueda restringida a ${cityName} produjo 0 resultados después del filtro postal/city. ` +
              `Se devuelven ${mapped.length} resultado(s) sin el filtro extra para no romper búsquedas.`
          );
          return mapped;
        }
      }

      return mapped;
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  }

  /**
   * Convierte coordenadas a dirección (Reverse Geocoding)
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} Objeto con dirección y detalles
   */
  async reverseGeocode(lat, lng, options = {}) {
    try {
      const {
        zoom = 18, // Nivel de detalle (18 = máximo)
        language = "es",
      } = options;

      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "json",
        zoom: zoom.toString(),
        addressdetails: "1",
        ...(language && { "accept-language": language }),
      });

      const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
        headers: HEADERS,
      });

      if (!response.ok) {
        throw new Error("Error en la búsqueda de ubicación");
      }

      const data = await response.json();

      if (!data || data.error) {
        throw new Error("No se encontró dirección para estas coordenadas");
      }

      return {
        coords: {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lon),
        },
        address: data.display_name,
        details: {
          road: data.address?.road,
          houseNumber: data.address?.house_number,
          suburb: data.address?.suburb,
          city: data.address?.city || data.address?.town,
          state: data.address?.state,
          country: data.address?.country,
          postcode: data.address?.postcode,
        },
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  }

  /**
   * Obtiene ubicación actual del usuario (GPS)
   * @param {object} options - Opciones de geolocalización
   * @returns {Promise<object>} Ubicación con coords y dirección
   */
  async getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada en este navegador"));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Obtener dirección
            const location = await this.reverseGeocode(lat, lng);

            resolve({
              ...location,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          } catch (error) {
            // Si falla el reverse geocoding, devolver solo coords
            resolve({
              coords: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              address: `${position.coords.latitude.toFixed(
                6
              )}, ${position.coords.longitude.toFixed(6)}`,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          }
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permiso de ubicación denegado";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Ubicación no disponible";
              break;
            case error.TIMEOUT:
              errorMessage = "Tiempo de espera agotado";
              break;
            default:
              errorMessage = "Error al obtener ubicación";
          }
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  /**
   * Calcula distancia entre dos puntos en km (Haversine)
   * @param {object} coords1 - {lat, lng}
   * @param {object} coords2 - {lat, lng}
   * @returns {number} Distancia en kilómetros
   */
  calculateDistance(coords1, coords2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(coords2.lat - coords1.lat);
    const dLng = this.toRad(coords2.lng - coords1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coords1.lat)) *
        Math.cos(this.toRad(coords2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convierte grados a radianes
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formatea distancia en formato legible
   * @param {number} km - Distancia en kilómetros
   * @returns {string} Distancia formateada
   */
  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(2)} km`;
  }

  /**
   * Valida coordenadas
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {boolean} True si son válidas
   */
  validateCoordinates(lat, lng) {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  }
}

export default new GeocodingService();
