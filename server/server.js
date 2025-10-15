import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileService from './services/fileService.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Inicializar FileService antes de levantar servidor
async function initializeServer() {
  try {
    // Inicializar sistema de archivos
    await fileService.initialize();

    // Montar rutas
    app.use('/api', routes);

    // Manejadores de errores (deben ir al final)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('   ================================');
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Data file: ${fileService.dataPath}`);
      console.log('   ================================\n');
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Iniciar servidor
initializeServer();