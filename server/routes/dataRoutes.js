/**
 * Data Routes - Rutas para operaciones de datos
 */

import express from 'express';
import dataController from '../controllers/dataController.js';

const router = express.Router();

// Rutas principales
router.get('/', dataController.getAllData.bind(dataController));
router.post('/', dataController.saveAllData.bind(dataController));

// Operaciones especiales
router.post('/reset', dataController.resetData.bind(dataController));
router.post('/backup', dataController.createBackup.bind(dataController));
router.get('/metadata', dataController.getMetadata.bind(dataController));

// Operaciones por colección
router.get('/:collection', dataController.getCollection.bind(dataController));
router.put('/:collection', dataController.updateCollection.bind(dataController));

export default router;