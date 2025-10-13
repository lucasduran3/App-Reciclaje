/**
 * Routes Index - Agregador de todas las rutas
 */

import express from 'express';
import dataRoutes from './dataRoutes.js';

const router = express.Router();

// Montar rutas
router.use('/data', dataRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz de API
router.get('/', (req, res) => {
  res.json({
    message: 'Eco-Game API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      data: {
        getAll: 'GET /api/data',
        save: 'POST /api/data',
        reset: 'POST /api/data/reset',
        backup: 'POST /api/data/backup',
        metadata: 'GET /api/data/metadata',
        collection: 'GET /api/data/:collection',
        updateCollection: 'PUT /api/data/:collection'
      }
    }
  });
});

export default router;