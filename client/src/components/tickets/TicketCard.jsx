import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

export default function TicketCard({ ticket, users = [] }) {
  const navigate = useNavigate();
  
  const reporter = users.find(u => u.id === ticket.reportedBy);
  
  const statusConfig = {
    reported: { variant: 'warning', label: 'Reportado', icon: '📍' },
    accepted: { variant: 'info', label: 'Aceptado', icon: '✋' },
    in_progress: { variant: 'primary', label: 'En progreso', icon: '🚧' },
    validating: { variant: 'secondary', label: 'Validando', icon: '⏳' },
    completed: { variant: 'success', label: 'Completado', icon: '✅' },
    rejected: { variant: 'danger', label: 'Rechazado', icon: '❌' },
  };

  const typeIcons = {
    general: '🗑️',
    recyclable: '♻️',
    organic: '🌿',
    electronic: '⚡',
    hazardous: '☢️',
    bulky: '📦',
  };

  const config = statusConfig[ticket.status] || statusConfig.reported;

  return (
    <Card 
      hoverable 
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="ticket-card"
    >
      <div className="ticket-card-header">
        <div className="ticket-card-status">
          <Badge variant={config.variant} icon={config.icon}>
            {config.label}
          </Badge>
          <Badge variant="default" icon={typeIcons[ticket.type]}>
            {ticket.type}
          </Badge>
        </div>
        {ticket.priority === 'urgent' && (
          <Badge variant="danger" icon="🚨">Urgente</Badge>
        )}
      </div>

      <h3 className="ticket-card-title">{ticket.title}</h3>
      <p className="ticket-card-description">
        {ticket.description.substring(0, 100)}...
      </p>

      <div className="ticket-card-meta">
        <span className="ticket-card-zone">📍 {ticket.zone}</span>
        <span className="ticket-card-date">
          {new Date(ticket.createdAt).toLocaleDateString('es-AR')}
        </span>
      </div>

      {reporter && (
        <div className="ticket-card-footer">
          <Avatar src={reporter.avatar} alt={reporter.name} size="small" />
          <span className="ticket-card-reporter">{reporter.name}</span>
        </div>
      )}

      <div className="ticket-card-interactions">
        <span>❤️ {ticket.interactions.likes}</span>
        <span>💬 {ticket.interactions.comments}</span>
        <span>👁️ {ticket.interactions.views}</span>
      </div>
    </Card>
  );
}