import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function MapView() {
  const [selectedZone, setSelectedZone] = useState(null);
  const { tickets, loading } = useTickets({ 
    zone: selectedZone,
    status: 'reported'
  });

  const zones = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];

  // Placeholder para el mapa - en producción usarías react-leaflet
  return (
    <div className="page map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺️ Mapa Interactivo</h1>
          <p className="page-subtitle">
            Visualiza los puntos sucios en tu zona
          </p>
        </div>
      </div>

      <div className="map-container">
        <div className="map-sidebar">
          <Card>
            <h3 className="card-title">Filtrar por Zona</h3>
            <div className="zone-filters">
              <Button
                variant={selectedZone === null ? 'primary' : 'ghost'}
                fullWidth
                onClick={() => setSelectedZone(null)}
              >
                Todas las zonas
              </Button>
              {zones.map(zone => (
                <Button
                  key={zone}
                  variant={selectedZone === zone ? 'primary' : 'ghost'}
                  fullWidth
                  onClick={() => setSelectedZone(zone)}
                >
                  {zone}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="map-legend">
            <h4>Leyenda</h4>
            <div className="legend-items">
              <div className="legend-item">
                <Badge variant="warning" icon="📍">Reportado</Badge>
              </div>
              <div className="legend-item">
                <Badge variant="info" icon="✋">Aceptado</Badge>
              </div>
              <div className="legend-item">
                <Badge variant="primary" icon="🚧">En progreso</Badge>
              </div>
              <div className="legend-item">
                <Badge variant="success" icon="✅">Completado</Badge>
              </div>
            </div>
          </Card>

          <div className="map-stats">
            <p>
              <strong>{tickets.length}</strong> tickets{' '}
              {selectedZone ? `en ${selectedZone}` : 'en total'}
            </p>
          </div>
        </div>

        <div className="map-view">
          {/* Placeholder para mapa */}
          <div className="map-placeholder">
            <div className="map-placeholder-content">
              <span className="map-placeholder-icon">🗺️</span>
              <h3>Mapa Interactivo</h3>
              <p>Aquí se mostrará el mapa con react-leaflet</p>
              <p className="map-placeholder-note">
                Por ahora, mostramos los tickets en lista
              </p>
            </div>
          </div>

          {/* Lista temporal de tickets */}
          <div className="map-tickets-list">
            {loading ? (
              <p>Cargando tickets...</p>
            ) : tickets.length > 0 ? (
              tickets.map(ticket => (
                <Card key={ticket.id} hoverable className="map-ticket-card">
                  <div className="map-ticket-header">
                    <Badge variant="warning">📍</Badge>
                    <span className="map-ticket-zone">{ticket.zone}</span>
                  </div>
                  <h4>{ticket.title}</h4>
                  <p className="map-ticket-address">
                    {ticket.location.address}
                  </p>
                  <Button size="small" variant="primary" fullWidth>
                    Ver Detalles
                  </Button>
                </Card>
              ))
            ) : (
              <Card>
                <p className="empty-message">
                  No hay tickets en esta zona
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}