import React from 'react';
import TicketCard from './TicketCard';
import Loader from '../common/Loader';

export default function TicketList({ tickets, users, loading }) {
  if (loading) {
    return <Loader text="Cargando tickets..." />;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📭</span>
        <h3>No hay tickets disponibles</h3>
        <p>Sé el primero en reportar un punto sucio</p>
      </div>
    );
  }

  return (
    <div className="ticket-list">
      {tickets.map(ticket => (
        <TicketCard 
          key={ticket.id} 
          ticket={ticket} 
          users={users}
        />
      ))}
    </div>
  );
}