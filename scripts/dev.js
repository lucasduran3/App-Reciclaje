import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🚀 Starting Eco-Game development servers...\n')

// Iniciar servidor
const server = spawn('npm', ['run', 'dev'], {
  cwd: join(rootDir, 'server'),
  shell: true,
  stdio: 'inherit'
})

// Iniciar cliente
const client = spawn('npm', ['run', 'dev'], {
  cwd: join(rootDir, 'client'),
  shell: true,
  stdio: 'inherit'
})

// Manejo de errores
server.on('error', (err) => {
  console.error('❌ Server error:', err)
})

client.on('error', (err) => {
  console.error('❌ Client error:', err)
})

// Limpieza al cerrar
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...')
  server.kill()
  client.kill()
  process.exit()
})