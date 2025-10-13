/**
 * DataController - Controlador para operaciones de datos
 * 
 * Maneja la lógica de negocio para carga, guardado y reinicio de datos.
 */

import fileService from '../services/fileService.js';

class DataController {
  /**
   * GET /api/data
   * Obtiene todos los datos de la aplicación
   */
  async getAllData(req, res, next) {
    try {
      const data = fileService.getData();
      
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/data
   * Guarda todos los datos (reemplaza completamente)
   */
  async saveAllData(req, res, next) {
    try {
      const newData = req.body;

      // Validación básica
      if (!newData || typeof newData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid data format'
        });
      }

      // Validar estructura mínima requerida
      const requiredCollections = [
        'users',
        'tickets',
        'missions',
        'comments',
        'leaderboard',
        'acopioPoints',
        'metadata'
      ];

      for (const collection of requiredCollections) {
        if (!newData[collection]) {
          return res.status(400).json({
            success: false,
            error: `Missing required collection: ${collection}`
          });
        }
      }

      // Guardar datos
      const savedData = await fileService.saveData(newData);

      res.json({
        success: true,
        message: 'Data saved successfully',
        data: savedData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/data/reset
   * Reinicia datos al estado inicial (mock_data.json)
   */
  async resetData(req, res, next) {
    try {
      // Crear backup antes de resetear
      await fileService.createBackup();

      // Resetear a mock
      const data = await fileService.resetToMock();

      res.json({
        success: true,
        message: 'Data reset to initial state successfully',
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/data/metadata
   * Obtiene solo los metadatos
   */
  async getMetadata(req, res, next) {
    try {
      const data = fileService.getData();

      res.json({
        success: true,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/data/backup
   * Crea un backup de los datos actuales
   */
  async createBackup(req, res, next) {
    try {
      const backupPath = await fileService.createBackup();

      res.json({
        success: true,
        message: 'Backup created successfully',
        backupPath,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/data/:collection
   * Obtiene una colección específica
   */
  async getCollection(req, res, next) {
    try {
      const { collection } = req.params;
      const items = fileService.getCollection(collection);

      res.json({
        success: true,
        collection,
        count: items.length,
        data: items,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/data/:collection
   * Actualiza una colección completa
   */
  async updateCollection(req, res, next) {
    try {
      const { collection } = req.params;
      const items = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Data must be an array'
        });
      }

      await fileService.updateCollection(collection, items);

      res.json({
        success: true,
        message: `Collection "${collection}" updated successfully`,
        count: items.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DataController();