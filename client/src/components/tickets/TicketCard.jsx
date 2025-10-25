import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import { Icon } from '@iconify/react';

export default function TicketCard({ ticket, users = [] }) {
  const navigate = useNavigate();
  
  const reporter = users.find(u => u.id === ticket.reportedBy);
  
  const statusConfig = {
    reported: { variant: 'warning', label: 'Reportado', icon: <Icon icon="fluent-color:megaphone-loud-32"></Icon> },
    accepted: { variant: 'info', label: 'Aceptado', icon: <Icon icon="fluent-color:circle-multiple-hint-checkmark-48"></Icon> },
    in_progress: { variant: 'primary', label: 'En progreso', icon: <Icon icon="fluent-color:arrow-clockwise-dashes-32"></Icon> },
    validating: { variant: 'secondary', label: 'Validando', icon: <Icon icon="fluent-color:people-sync-16"></Icon> },
    completed: { variant: 'success', label: 'Completado', icon: <Icon icon="fluent-color:checkmark-circle-48"></Icon> },
    rejected: { variant: 'danger', label: 'Rechazado', icon: <Icon icon="fluent-color:dismiss-circle-32"></Icon> },
  };

  const typeIcons = {
    general: <Icon icon="fluent-emoji-flat:wastebasket"></Icon>,
    recyclable: <Icon icon="fluent-emoji-flat:recycling-symbol"></Icon>,
    organic: <Icon icon="fluent-emoji-flat:leafy-green"></Icon>,
    electronic: <Icon icon="fluent-emoji-flat:electric-plug"></Icon>,
    hazardous: <Icon icon="fluent-emoji-flat:biohazard"></Icon>,
    bulky: <Icon icon="fluent-emoji-flat:package"></Icon>,
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
        {/*{ticket.priority === 'urgent' && (
          <Badge variant="danger" icon={<Icon icon="fluent-color:error-circle-48"></Icon>}>Urgente</Badge>
        )}/**/}
      </div>

      <h3 className="ticket-card-title">{ticket.title}</h3>
      <p className="ticket-card-description">
        {ticket.description.substring(0, 100)}...
      </p>

      <div className="ticket-card-meta">
        <span className="ticket-card-zone"><Icon icon="fluent-color:pin-16"></Icon> {ticket.zone}</span>
        <span className="ticket-card-date">
          {new Date(ticket.created_at).toLocaleDateString('es-AR')}
        </span>
      </div>

      {reporter && (
        <div className="ticket-card-footer">
          <Avatar src={reporter.avatar} alt={reporter.name} size="small" />
          <span className="ticket-card-reporter">{reporter.name}</span>
        </div>
      )}

      <div className="ticket-card-interactions">
        <span><Icon icon="fluent-color:heart-32"></Icon> {ticket.interactions.likes}</span>
        <span><Icon icon="fluent-color:comment-multiple-16"></Icon> {ticket.interactions.comments}</span>
        <span><Icon icon="fluent-emoji-flat:eye"></Icon> {ticket.interactions.views}</span>
      </div>
    </Card>
  );
}