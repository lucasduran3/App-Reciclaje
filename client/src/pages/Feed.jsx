import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTickets } from '../hooks/useTickets';
import { Icon } from '@iconify/react';
import TicketList from '../components/tickets/TicketList';
import TicketFilters from '../components/tickets/TicketFilters';
import Button from '../components/common/Button';

export default function Feed() {
  const { appData } = useApp();
  const [filters, setFilters] = useState({});
  const { tickets, loading, refreshTickets } = useTickets(filters);

const handleFilterChange = (key, value) => {
  setFilters(prev => {
    const next = { ...prev };

    // Si el valor es null/undefined/empty string -> quitamos la clave
    if (value === null || value === undefined || value === '') {
      delete next[key];
    } else {
      next[key] = value;
    }

    return next;
  });
};

  return (
    <div className="page feed-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Icon icon="fluent-color:news-28"></Icon> Feed de Tickets</h1>
          <p className="page-subtitle">
            Explora y ayuda con los puntos sucios reportados en tu ciudad
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={<Icon icon="fluent-color:megaphone-loud-32"></Icon>}
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
        <span><Icon icon="fluent-color:calendar-data-bar-16"></Icon> Total: {tickets.length} tickets</span>
        <Button 
          variant="ghost" 
          size="small"
          icon={<Icon icon="fluent-color:arrow-sync-20"></Icon>}
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