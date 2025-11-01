/**
 * API Client - Cliente HTTP con autenticación Supabase
 * client/src/services/apiClient.js
 */

import supabase from "../config/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class ApiClient {
  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Obtiene el token de autenticación actual
   */
  async getAuthToken() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  /**
   * Método genérico para hacer requests
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Obtener token de autenticación
    const token = await this.getAuthToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        // Agregar Authorization header si hay token
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Manejar errores de autenticación
        if (response.status === 401) {
          // Token inválido o expirado - redirigir a login
          console.error("Authentication failed - redirecting to login");
          window.location.href = "/login";
          throw new Error(
            "Sesión expirada. Por favor inicia sesión nuevamente."
          );
        }

        throw new Error(data.error?.message || data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error(
        `API Error [${options.method || "GET"} ${endpoint}]:`,
        error
      );
      throw error;
    }
  }

  // ==================== DATA OPERATIONS ====================

  /**
   * Obtiene todos los datos
   */
  async getAllData() {
    return this.request("/data");
  }

  /**
   * Guarda todos los datos
   */
  async saveAllData(data) {
    return this.request("/data", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Reinicia datos al estado inicial
   */
  async resetData() {
    return this.request("/data/reset", {
      method: "POST",
    });
  }

  /**
   * Crea un backup
   */
  async createBackup() {
    return this.request("/data/backup", {
      method: "POST",
    });
  }

  /**
   * Obtiene metadatos
   */
  async getMetadata() {
    return this.request("/data/metadata");
  }

  /**
   * Obtiene una colección específica
   */
  async getCollection(collectionName) {
    return this.request(`/data/${collectionName}`);
  }

  /**
   * Actualiza una colección completa
   */
  async updateCollection(collectionName, items) {
    return this.request(`/data/${collectionName}`, {
      method: "PUT",
      body: JSON.stringify(items),
    });
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Verifica estado del servidor
   */
  async healthCheck() {
    return this.request("/health");
  }
}

// Exportar instancia singleton
export default new ApiClient();
