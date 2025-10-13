/**
 * Script para reiniciar datos a estado inicial
 * 
 * Uso: node scripts/reset-data.js
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = join(__dirname, '../server/data/data.json');
const mockPath = join(__dirname, '../server/data/mock_data.json');
const backupDir = join(__dirname, '../server/data/backups');

async function resetData() {
  try {
    console.log('🔄 Resetting data to initial state...\n');

    // Crear directorio de backups si no existe
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Ignorar si ya existe
    }

    // Crear backup del data.json actual si existe
    try {
      const currentData = await fs.readFile(dataPath, 'utf-8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(backupDir, `backup-${timestamp}.json`);
      
      await fs.writeFile(backupPath, currentData, 'utf-8');
      console.log(`✅ Backup created: ${backupPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('⚠️  Could not create backup:', error.message);
      }
    }

    // Copiar mock_data.json a data.json
    const mockData = await fs.readFile(mockPath, 'utf-8');
    const data = JSON.parse(mockData);
    
    // Actualizar timestamp
    data.metadata.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log('✅ Data reset successfully');
    console.log(`📂 data.json restored from mock_data.json\n`);
    console.log('Statistics:');
    console.log(`  - Users: ${data.users.length}`);
    console.log(`  - Tickets: ${data.tickets.length}`);
    console.log(`  - Missions: ${data.missions.length}`);
    console.log(`  - Comments: ${data.comments.length}`);
    console.log(`  - Acopio Points: ${data.acopioPoints.length}\n`);
    
  } catch (error) {
    console.error('❌ Error resetting data:', error.message);
    process.exit(1);
  }
}

resetData();