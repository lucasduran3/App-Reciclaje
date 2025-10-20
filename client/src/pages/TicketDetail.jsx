/**
 * Página de detalle del ticket
 * Crear: client/src/pages/TicketDetail.jsx
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTicket } from '../hooks/useTickets';
import { useUsers } from '../hooks/useUsers';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import TicketActions from '../components/tickets/TicketActions';
import apiClient from '../services/apiClient';

const STATUS_CONFIG = {
  reported: { variant: 'warning', label: 'Reportado', icon: 'fluent-color:megaphone-loud-32' },
  accepted: { variant: 'info', label: 'Aceptado', icon: 'fluent-color:circle-multiple-hint-checkmark-48' },
  in_progress: { variant: 'primary', label: 'En Progreso', icon: 'fluent-color:arrow-clockwise-dashes-32' },
  validating: { variant: 'secondary', label: 'Validando', icon: 'fluent-color:people-sync-16' },
  completed: { variant: 'success', label: 'Completado', icon: 'fluent-color:checkmark-circle-48' },
  rejected: { variant: 'danger', label: 'Rechazado', icon: 'fluent-color:dismiss-circle-32' }
};

const PRIORITY_CONFIG = {
  low: { variant: 'info', label: 'Baja' },
  medium: { variant: 'warning', label: 'Media' },
  high: { variant: 'danger', label: 'Alta' },
  urgent: { variant: 'danger', label: 'Urgente' }
};

const TYPE_ICONS = {
  general: 'fluent-emoji-flat:wastebasket',
  recyclable: 'fluent-emoji-flat:recycling-symbol',
  organic: 'fluent-emoji-flat:leafy-green',
  electronic: 'fluent-emoji-flat:electric-plug',
  hazardous: 'fluent-emoji-flat:biohazard',
  bulky: 'fluent-emoji-flat:package'
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users } = useUsers();
  const [comments, setComments] = useState([]);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    ticket,
    loading,
    error,
    toggleLike,
    addComment,
    acceptTicket,
    isLikedByUser,
    canAccept,
    canValidate
  } = useTicket(id);

  // Cargar comentarios
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return;
      try {
        const response = await apiClient.request(`/comments/ticket/${id}`);
        setComments(response.data || []);
      } catch (err) {
        console.error('Error loading comments:', err);
        setComments([]);
      }
    };
    loadComments();
  }, [id, ticket]); // Recargar cuando cambie el ticket

  const handleAccept = () => {
    setShowAcceptModal(true);
  };

  const confirmAccept = async () => {
    try {
      await acceptTicket();
      setShowAcceptModal(false);
    } catch (err) {
      alert(err.message || 'Error al aceptar ticket');
    }
  };

  const handleValidate = () => {
    navigate(`/tickets/${id}/validate`);
  };

  const handleCommentAdded = async (text) => {
    await addComment(text);
    // Recargar comentarios
    const response = await apiClient.request(`/comments/ticket/${id}`);
    setComments(response.data || []);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner" />
        <p className="loader-text">Cargando ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon icon="fluent-color:error-circle-48" className="empty-icon" width={64} />
          <h3>Error al cargar el ticket</h3>
          <p>{error || 'Ticket no encontrado'}</p>
          <Button variant="primary" onClick={() => navigate('/tickets')}>
            Volver a tickets
          </Button>
        </div>
      </div>
    );
  }

  const reporter = users.find(u => u.id === ticket.reportedBy);
  const cleaner = ticket.acceptedBy ? users.find(u => u.id === ticket.acceptedBy) : null;
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.reported;
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="page">
      <Button 
        variant="ghost"
        onClick={() => navigate(-1)}
        icon={<Icon icon="fluent:arrow-left-24-filled" width="20" />}
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        Volver
      </Button>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gap: 'var(--spacing-xl)'
      }}>
        {/* Contenido principal */}
        <div style={{ minWidth: 0 }}>
          {/* Header con título y badges */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 'var(--spacing-md)',
              gap: 'var(--spacing-md)',
              flexWrap: 'wrap'
            }}>
              <h1 className="page-title" style={{ marginBottom: 0, wordBreak: 'break-word', flex: 1 }}>
                {ticket.title}
              </h1>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
                <Badge 
                  variant={statusConfig.variant} 
                  icon={<Icon icon={statusConfig.icon} width="16" />}
                >
                  {statusConfig.label}
                </Badge>
                <Badge 
                  variant={priorityConfig.variant}
                  icon={<Icon icon="fluent:flag-24-filled" width="16" />}
                >
                  {priorityConfig.label}
                </Badge>
              </div>
            </div>

            <p style={{ 
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-lg)',
              lineHeight: 1.6
            }}>
              {ticket.description}
            </p>

            {/* Ubicación y fecha */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <Icon icon="fluent-color:location-24-filled" width="20" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Ubicación
                  </div>
                  <div style={{ fontWeight: 500, wordBreak: 'break-word' }}>
                    {ticket.location.address}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Zona: {ticket.zone}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <Icon icon="fluent-color:calendar-24-filled" width="20" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Reportado
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {new Date(ticket.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(ticket.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Fotos */}
          {ticket.photos.before && ticket.photos.before.length > 0 && (
            <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h3 className="card-title">Fotos del Reporte</h3>
              <div>
                <img
                  src={ticket.photos.before[currentImageIndex]}
                  alt={`Foto ${currentImageIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                    marginBottom: 'var(--spacing-md)'
                  }}
                />
                {ticket.photos.before.length > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-sm)',
                    overflowX: 'auto',
                    paddingBottom: 'var(--spacing-sm)'
                  }}>
                    {ticket.photos.before.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Miniatura ${index + 1}`}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          border: index === currentImageIndex 
                            ? '3px solid var(--primary)' 
                            : '3px solid transparent',
                          opacity: index === currentImageIndex ? 1 : 0.7,
                          flexShrink: 0
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Participantes */}
          <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 className="card-title">Participantes</h3>
            
            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
              {/* Reporter */}
              {reporter && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)'
                }}>
                  <Avatar src={reporter.avatar} alt={reporter.name} size="medium" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}>
                      Reportado por
                    </div>
                    <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{reporter.name}</div>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-word'
                    }}>
                      {reporter.email}
                    </div>
                  </div>
                  <Icon icon="fluent:person-24-filled" width="24" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              )}

              {/* Cleaner */}
              {cleaner && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  background: 'var(--primary-light)',
                  borderRadius: 'var(--radius)'
                }}>
                  <Avatar src={cleaner.avatar} alt={cleaner.name} size="medium" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--primary-dark)',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}>
                      Aceptado por
                    </div>
                    <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{cleaner.name}</div>
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-word'
                    }}>
                      {cleaner.email}
                    </div>
                  </div>
                  <Icon icon="fluent:person-24-filled" width="24" style={{ color: 'var(--primary)', flexShrink: 0 }} />
                </div>
              )}

              {!cleaner && (
                <div style={{ 
                  textAlign: 'center',
                  padding: 'var(--spacing-lg)',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-muted)'
                }}>
                  <Icon icon="fluent:clock-24-regular" width="32" style={{ marginBottom: 'var(--spacing-sm)' }} />
                  <div>Esperando que alguien acepte este ticket</div>
                </div>
              )}
            </div>
          </Card>

          {/* Comentarios */}
          <Card>
            <h3 className="card-title">
              Comentarios ({comments.length})
            </h3>
            
            {comments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                No hay comentarios aún. Sé el primero en comentar.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {comments.map((comment) => {
                  const commentUser = users.find(u => u.id === comment.userId);
                  return (
                    <div 
                      key={comment.id}
                      style={{ 
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius)'
                      }}
                    >
                      {commentUser && (
                        <Avatar 
                          src={commentUser.avatar} 
                          alt={commentUser.name}
                          size="small"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 'var(--spacing-xs)',
                          gap: 'var(--spacing-sm)'
                        }}>
                          <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>
                            {comment.userName || commentUser?.name || 'Usuario'}
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            flexShrink: 0
                          }}>
                            {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p style={{ 
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          margin: 0,
                          wordBreak: 'break-word'
                        }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Acciones */}
        <div style={{ position: 'sticky', top: 'var(--spacing-lg)', alignSelf: 'start' }}>
          <TicketActions
            ticket={ticket}
            isLikedByUser={isLikedByUser}
            canAccept={canAccept}
            canValidate={canValidate}
            onLike={toggleLike}
            onComment={handleCommentAdded}
            onAccept={handleAccept}
            onValidate={handleValidate}
          />

          {/* Información adicional */}
          <Card style={{ marginTop: 'var(--spacing-lg)' }}>
            <h3 className="card-title">Información</h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  <Icon icon={TYPE_ICONS[ticket.type]} width="16" style={{ marginRight: '0.25rem' }} />
                  Tipo
                </span>
                <span style={{ fontWeight: 500 }}>{ticket.type}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Tamaño estimado</span>
                <span style={{ fontWeight: 500 }}>{ticket.estimatedSize}</span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  <Icon icon="fluent-emoji-flat:eye" width="16" style={{ marginRight: '0.25rem' }} />
                  Vistas
                </span>
                <span style={{ fontWeight: 500 }}>{ticket.interactions.views}</span>
              </div>
              {ticket.acceptedAt && (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm) 0',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Aceptado el</span>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(ticket.acceptedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              )}
              {ticket.completedAt && (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm) 0'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Completado el</span>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(ticket.completedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de confirmación para aceptar */}
      {showAcceptModal && (
        <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Aceptar Ticket</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAcceptModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro que deseas aceptar este ticket?</p>
              <p style={{ 
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: 'var(--spacing-md)'
              }}>
                Al aceptar, te comprometes a resolver este reporte y ganarás 20 puntos.
              </p>
            </div>
            <div className="modal-footer">
              <Button 
                variant="ghost"
                onClick={() => setShowAcceptModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="secondary"
                onClick={confirmAccept}
              >
                Sí, aceptar ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}