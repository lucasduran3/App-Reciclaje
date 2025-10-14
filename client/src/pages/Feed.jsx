import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../hooks/useTickets';
import TicketList from '../components/tickets/TicketList';
import TicketFilters from '../components/tickets/TicketFilters';
import Button from '../components/common/Button';

export default function Feed() {
  const { appData } = useApp();
  const [filters, setFilters] = useState({});
  const { tickets, loading, refreshTickets } = useTickets(filters);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="page feed-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📰 Feed de Tickets</h1>
          <p className="page-subtitle">
            Explora y ayuda con los puntos sucios reportados en tu ciudad
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="📍"
          onClick={() => window.location.href = '/tickets/new'}
        >
          Reportar Nuevo
        </Button>
      </div>

      <TicketFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="feed-stats">
        <span>📊 Total: {tickets.length} tickets</span>
        <Button 
          variant="ghost" 
          size="small"
          icon="🔄"
          onClick={refreshTickets}
        >
          Actualizar
        </Button>
      </div>

      <TicketList 
        tickets={tickets}
        users={appData?.users || []}
        loading={loading}
      />
    </div>
  );
}