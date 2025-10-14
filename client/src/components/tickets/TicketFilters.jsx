import React from 'react';

export default function TicketFilters({ filters, onFilterChange }) {
  const zones = ['Todos', 'Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
  const statuses = [
    { value: 'all', label: 'Todos' },
    { value: 'reported', label: 'Reportados' },
    { value: 'accepted', label: 'Aceptados' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completados' },
  ];

  return (
    <div className="ticket-filters">
      <div className="filter-group">
        <label>Zona:</label>
        <select 
          value={filters.zone || 'Todos'}
          onChange={(e) => onFilterChange('zone', e.target.value === 'Todos' ? null : e.target.value)}
        >
          {zones.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Estado:</label>
        <select 
          value={filters.status || 'all'}
          onChange={(e) => onFilterChange('status', e.target.value === 'all' ? null : e.target.value)}
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}