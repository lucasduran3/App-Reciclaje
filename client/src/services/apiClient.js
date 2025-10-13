/**
 * API Client - Cliente HTTP para comunicación con el servidor
 * 
 * Proporciona métodos convenientes para todas las operaciones de datos.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Método genérico para hacer requests
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== DATA OPERATIONS ====================

  /**
   * Obtiene todos los datos
   */
  async getAllData() {
    return this.request('/data');
  }

  /**
   * Guarda todos los datos
   */
  async saveAllData(data) {
    return this.request('/data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Reinicia datos al estado inicial
   */
  async resetData() {
    return this.request('/data/reset', {
      method: 'POST'
    });
  }

  /**
   * Crea un backup
   */
  async createBackup() {
    return this.request('/data/backup', {
      method: 'POST'
    });
  }

  /**
   * Obtiene metadatos
   */
  async getMetadata() {
    return this.request('/data/metadata');
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
      method: 'PUT',
      body: JSON.stringify(items)
    });
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Verifica estado del servidor
   */
  async healthCheck() {
    return this.request('/health');
  }
}

// Exportar instancia singleton
export default new ApiClient();