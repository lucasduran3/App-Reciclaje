/**
 * FileService - Servicio de acceso a archivos JSON
 * 
 * Maneja toda la lógica de lectura y escritura de archivos de datos.
 * Implementa patrón Singleton para mantener datos en memoria.
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FileService {
  constructor() {
    this.dataPath = join(__dirname, '../data/data.json');
    this.mockPath = join(__dirname, '../data/mock_data.json');
    this.dataCache = null; // Cache en memoria
    this.initialized = false;
  }

  /**
   * Inicializa el servicio cargando datos
   * Si data.json no existe, copia desde mock_data.json
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadData();
      this.initialized = true;
      console.log('✅ FileService initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing FileService:', error.message);
      throw error;
    }
  }

  /**
   * Carga datos desde data.json
   * Si no existe, copia desde mock_data.json
   * 
   * @returns {Promise<Object>} Datos completos de la aplicación
   */
  async loadData() {
    try {
      // Intentar cargar data.json
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.dataCache = JSON.parse(data);
      console.log('📂 Loaded data from data.json');
      return this.dataCache;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Si no existe, copiar desde mock
        console.log('📋 data.json not found, copying from mock_data.json');
        return await this.resetToMock();
      }
      throw new Error(`Failed to load data: ${error.message}`);
    }
  }

  /**
   * Guarda datos en data.json
   * Actualiza metadata.lastUpdated automáticamente
   * 
   * @param {Object} data - Datos completos a guardar
   * @returns {Promise<Object>} Datos guardados
   */
  async saveData(data) {
    try {
      // Validar estructura básica
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure');
      }

      // Actualizar metadata
      if (!data.metadata) {
        data.metadata = {};
      }
      data.metadata.lastUpdated = new Date().toISOString();

      // Actualizar estadísticas
      data.metadata.totalUsers = data.users?.length || 0;
      data.metadata.totalTickets = data.tickets?.length || 0;
      data.metadata.totalMissions = data.missions?.length || 0;
      data.metadata.activeTickets = data.tickets?.filter(
        t => t.status !== 'completed'
      ).length || 0;

      // Guardar en archivo con formato legible
      await fs.writeFile(
        this.dataPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      // Actualizar cache
      this.dataCache = data;

      console.log('💾 Data saved successfully');
      return data;
    } catch (error) {
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  /**
   * Reinicia datos al estado inicial desde mock_data.json
   * 
   * @returns {Promise<Object>} Datos reiniciados
   */
  async resetToMock() {
    try {
      // Leer mock_data.json
      const mockData = await fs.readFile(this.mockPath, 'utf-8');
      const data = JSON.parse(mockData);

      // Actualizar timestamps
      data.metadata.lastUpdated = new Date().toISOString();

      // Guardar como data.json
      await fs.writeFile(
        this.dataPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      // Actualizar cache
      this.dataCache = data;

      console.log('🔄 Data reset to mock successfully');
      return data;
    } catch (error) {
      throw new Error(`Failed to reset data: ${error.message}`);
    }
  }

  /**
   * Obtiene datos desde cache (no lee archivo)
   * Más rápido para operaciones frecuentes
   * 
   * @returns {Object} Datos en cache
   */
  getData() {
    if (!this.dataCache) {
      throw new Error('FileService not initialized. Call initialize() first.');
    }
    return this.dataCache;
  }

  /**
   * Obtiene una colección específica
   * 
   * @param {string} collection - Nombre de la colección (users, tickets, etc.)
   * @returns {Array} Elementos de la colección
   */
  getCollection(collection) {
    const data = this.getData();
    if (!data[collection]) {
      throw new Error(`Collection "${collection}" not found`);
    }
    return data[collection];
  }

  /**
   * Actualiza una colección específica
   * 
   * @param {string} collection - Nombre de la colección
   * @param {Array} items - Nuevos elementos
   * @returns {Promise<Object>} Datos actualizados
   */
  async updateCollection(collection, items) {
    const data = this.getData();
    
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    data[collection] = items;
    return await this.saveData(data);
  }

  /**
   * Busca un elemento por ID en una colección
   * 
   * @param {string} collection - Nombre de la colección
   * @param {string} id - ID del elemento
   * @returns {Object|null} Elemento encontrado o null
   */
  findById(collection, id) {
    const items = this.getCollection(collection);
    return items.find(item => item.id === id) || null;
  }

  /**
   * Agrega un elemento a una colección
   * 
   * @param {string} collection - Nombre de la colección
   * @param {Object} item - Elemento a agregar
   * @returns {Promise<Object>} Elemento agregado
   */
  async addToCollection(collection, item) {
    const items = this.getCollection(collection);
    
    // Verificar que no exista el ID
    if (items.some(i => i.id === item.id)) {
      throw new Error(`Item with id "${item.id}" already exists`);
    }

    items.push(item);
    await this.updateCollection(collection, items);
    return item;
  }

  /**
   * Actualiza un elemento en una colección
   * 
   * @param {string} collection - Nombre de la colección
   * @param {string} id - ID del elemento
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Elemento actualizado
   */
  async updateInCollection(collection, id, updates) {
    const items = this.getCollection(collection);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error(`Item with id "${id}" not found`);
    }

    // Merge updates
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.updateCollection(collection, items);
    return items[index];
  }

  /**
   * Elimina un elemento de una colección
   * 
   * @param {string} collection - Nombre de la colección
   * @param {string} id - ID del elemento
   * @returns {Promise<boolean>} True si se eliminó
   */
  async deleteFromCollection(collection, id) {
    const items = this.getCollection(collection);
    const initialLength = items.length;
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === initialLength) {
      throw new Error(`Item with id "${id}" not found`);
    }

    await this.updateCollection(collection, filtered);
    return true;
  }

  /**
   * Crea un backup de los datos actuales
   * 
   * @returns {Promise<string>} Path del backup
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(
        __dirname,
        `../data/backup-${timestamp}.json`
      );

      const data = this.getData();
      await fs.writeFile(
        backupPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      console.log(`📦 Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
export default new FileService();