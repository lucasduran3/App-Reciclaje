import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  })
})

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const dataPath = join(__dirname, process.env.DATA_FILE)
    const mockPath = join(__dirname, process.env.MOCK_FILE)
    
    try {
      const data = await fs.readFile(dataPath, 'utf-8')
      res.json(JSON.parse(data))
    } catch (error) {
      // Si no existe data.json, copiar desde mock_data.json
      const mockData = await fs.readFile(mockPath, 'utf-8')
      await fs.writeFile(dataPath, mockData)
      res.json(JSON.parse(mockData))
    }
  } catch (error) {
    console.error('Error reading data:', error)
    res.status(500).json({ error: 'Error loading data' })
  }
})

// Save all data
app.post('/api/data', async (req, res) => {
  try {
    const dataPath = join(__dirname, process.env.DATA_FILE)
    await fs.writeFile(dataPath, JSON.stringify(req.body, null, 2))
    res.json({ success: true, message: 'Data saved successfully' })
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ error: 'Error saving data' })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
})