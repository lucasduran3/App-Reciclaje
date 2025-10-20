/**
 * Componente de acciones para el ticket
 * Crear: client/src/components/tickets/TicketActions.jsx
 */

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function TicketActions({ 
  ticket, 
  isLikedByUser,
  canAccept,
  canValidate,
  onLike, 
  onComment, 
  onAccept, 
  onValidate 
}) {
  const { currentUser } = useAuth();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onComment(commentText);
      setCommentText('');
      setShowCommentForm(false);
    } catch (error) {
      console.log("Error aqui");
      console.error('Error submitting comment:', error);
      alert('Error al enviar comentario', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Inicia sesión para interactuar con este ticket
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <h3 className="card-title">Acciones</h3>
      </div>

      {/* Botones de Like y Comentar */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <Button
          variant={isLikedByUser ? 'primary' : 'ghost'}
          onClick={onLike}
          style={{ flex: 1 }}
          icon={
            <Icon 
              icon={isLikedByUser ? "fluent-color:heart-32" : "fluent-color:heart-pulse-32"} 
              width="20"
            />
          }
        >
          {isLikedByUser ? 'Te gusta' : 'Me gusta'}
          {ticket.interactions.likes > 0 && (
            <span className="badge badge-small badge-default" style={{ marginLeft: '0.5rem' }}>
              {ticket.interactions.likes}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowCommentForm(!showCommentForm)}
          style={{ flex: 1 }}
          icon={<Icon icon="fluent-color:comment-multiple-16" width="20" />}
        >
          Comentar
          {ticket.interactions.comments > 0 && (
            <span className="badge badge-small badge-default" style={{ marginLeft: '0.5rem' }}>
              {ticket.interactions.comments}
            </span>
          )}
        </Button>
      </div>

      {/* Formulario de comentario */}
      {showCommentForm && (
        <form onSubmit={handleCommentSubmit} style={{ marginBottom: 'var(--spacing-lg)' }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu comentario..."
            rows={3}
            maxLength={500}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              marginBottom: 'var(--spacing-sm)',
              resize: 'vertical'
            }}
            disabled={isSubmitting}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-sm)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {commentText.length}/500
            </span>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentText('');
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="small"
                disabled={!commentText.trim() || isSubmitting}
                loading={isSubmitting}
              >
                Comentar
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Botones de Aceptar y Validar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 'var(--spacing-sm)'
      }}>
        <Button
          variant="secondary"
          fullWidth
          onClick={onAccept}
          disabled={!canAccept}
          icon={<Icon icon="fluent-color:checkmark-circle-48" width="20" />}
        >
          Aceptar Ticket
        </Button>

        <Button
          variant="primary"
          fullWidth
          onClick={onValidate}
          disabled={!canValidate}
          icon={<Icon icon="fluent-color:shield-checkmark-48" width="20" />}
        >
          Validar
        </Button>
      </div>

      {/* Mensajes informativos */}
      {!canAccept && ticket.status === 'reported' && ticket.reportedBy === currentUser.id && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-muted)',
          marginTop: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          No puedes aceptar tu propio ticket
        </p>
      )}

      {!canAccept && ticket.status !== 'reported' && ticket.status !== 'rejected' && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-muted)',
          marginTop: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          Este ticket ya fue aceptado por otro usuario
        </p>
      )}

      {!canValidate && ticket.status === 'accepted' && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-muted)',
          marginTop: 'var(--spacing-md)',
          textAlign: 'center'
        }}>
          Podrás validar cuando el limpiador complete el trabajo
        </p>
      )}
    </Card>
  );
}