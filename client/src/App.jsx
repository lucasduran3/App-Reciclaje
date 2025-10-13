import React from 'react'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🌱 Eco-Game</h1>
        <p>Reciclaje Gamificado</p>
      </header>
      
      <main className="main">
        <div className="welcome-card">
          <h2>¡Bienvenido!</h2>
          <p>Prototipo en desarrollo</p>
          <div className="status">
            <span className="status-dot"></span>
            <span>Cliente conectado</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App