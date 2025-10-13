import React, { useState, useEffect } from 'react'
import apiClient from './services/apiClient'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metadata, setMetadata] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getAllData()
      setData(response.data)
      setMetadata(response.data.metadata)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de reiniciar todos los datos?')) return
    
    try {
      setLoading(true)
      await apiClient.resetData()
      await loadData()
      alert('Datos reiniciados exitosamente')
    } catch (err) {
      setError(err.message)
      alert('Error al reiniciar datos: ' + err.message)
    }
  }

  const handleBackup = async () => {
    try {
      const response = await apiClient.createBackup()
      alert('Backup creado: ' + response.backupPath)
    } catch (err) {
      alert('Error al crear backup: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-card">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadData}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌱 Eco-Game</h1>
        <p>Reciclaje Gamificado</p>
      </header>
      
      <main className="main">
        <div className="welcome-card">
          <h2>¡Bienvenido!</h2>
          <p>Sistema de persistencia funcionando correctamente</p>
          <div className="status">
            <span className="status-dot"></span>
            <span>Conectado al servidor</span>
          </div>
        </div>

        {/* Metadatos */}
        {metadata && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{metadata.totalUsers}</div>
                <div className="stat-label">Usuarios</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-info">
                <div className="stat-value">{metadata.totalTickets}</div>
                <div className="stat-label">Tickets</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-value">{metadata.totalMissions}</div>
                <div className="stat-label">Misiones</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-value">{metadata.activeTickets}</div>
                <div className="stat-label">Tickets Activos</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de datos */}
        {data && (
          <div className="data-summary">
            <h3>📊 Resumen de Datos</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>Usuarios:</strong>
                <ul>
                  {data.users.map(user => (
                    <li key={user.id}>
                      {user.name} - {user.points} pts (Nivel {user.level})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-item">
                <strong>Tickets Recientes:</strong>
                <ul>
                  {data.tickets.slice(0, 3).map(ticket => (
                    <li key={ticket.id}>
                      {ticket.title} - <span className={`status-badge status-${ticket.status}`}>
                        {ticket.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-item">
                <strong>Misiones Activas:</strong>
                <ul>
                  {data.missions.filter(m => !m.completed).slice(0, 3).map(mission => (
                    <li key={mission.id}>
                      {mission.icon} {mission.title} ({mission.progress}/{mission.goal})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Controles de administración */}
        <div className="admin-controls">
          <h3>🔧 Administración</h3>
          <div className="button-group">
            <button onClick={loadData} className="btn btn-primary">
              🔄 Recargar Datos
            </button>
            <button onClick={handleBackup} className="btn btn-secondary">
              💾 Crear Backup
            </button>
            <button onClick={handleReset} className="btn btn-danger">
              ⚠️ Reiniciar Datos
            </button>
          </div>
          
          {metadata && (
            <div className="metadata-info">
              <small>
                Última actualización: {new Date(metadata.lastUpdated).toLocaleString('es-AR')}
              </small>
              <br />
              <small>Versión: {metadata.version}</small>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App