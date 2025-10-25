/**
 * Página de detalle del ticket
 * Crear: client/src/pages/TicketDetail.jsx
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useTicket } from "../hooks/useTickets";
import { useUsers } from "../hooks/useUsers";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Avatar from "../components/common/Avatar";
import TicketActions from "../components/tickets/TicketActions";
import apiClient from "../services/apiClient";

const STATUS_CONFIG = {
  reported: {
    variant: "warning",
    label: "Reportado",
    icon: "fluent-color:megaphone-loud-32",
  },
  accepted: {
    variant: "info",
    label: "Aceptado",
    icon: "fluent-color:circle-multiple-hint-checkmark-48",
  },
  in_progress: {
    variant: "primary",
    label: "En Progreso",
    icon: "fluent-color:arrow-clockwise-dashes-32",
  },
  validating: {
    variant: "secondary",
    label: "Validando",
    icon: "fluent-color:people-sync-16",
  },
  completed: {
    variant: "success",
    label: "Completado",
    icon: "fluent-color:checkmark-circle-48",
  },
  rejected: {
    variant: "danger",
    label: "Rechazado",
    icon: "fluent-color:dismiss-circle-32",
  },
};

const PRIORITY_CONFIG = {
  low: { variant: "info", label: "Baja" },
  medium: { variant: "warning", label: "Media" },
  high: { variant: "danger", label: "Alta" },
  urgent: { variant: "danger", label: "Urgente" },
};

const TYPE_ICONS = {
  general: "fluent-emoji-flat:wastebasket",
  recyclable: "fluent-emoji-flat:recycling-symbol",
  organic: "fluent-emoji-flat:leafy-green",
  electronic: "fluent-emoji-flat:electric-plug",
  hazardous: "fluent-emoji-flat:biohazard",
  bulky: "fluent-emoji-flat:package",
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
    canValidate,
  } = useTicket(id);

  // Cargar comentarios
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return;
      try {
        const response = await apiClient.request(`/comments/ticket/${id}`);
        setComments(response.data || []);
      } catch (err) {
        console.error("Error loading comments:", err);
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
      alert(err.message || "Error al aceptar ticket");
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
          <Icon
            icon="fluent-color:error-circle-48"
            className="empty-icon"
            width={64}
          />
          <h3>Error al cargar el ticket</h3>
          <p>{error || "Ticket no encontrado"}</p>
          <Button variant="primary" onClick={() => navigate("/feed")}>
            Volver a tickets
          </Button>
        </div>
      </div>
    );
  }

  const reporter = users.find((u) => u.id === ticket.reported_by);
  const cleaner = ticket.accepted_by
    ? users.find((u) => u.id === ticket.accepted_by)
    : null;
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.reported;
  const priorityConfig =
    PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="page">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        icon={<Icon icon="fluent:arrow-left-24-filled" width="20" />}
      >
        Volver
      </Button>

      <div className="ticketD-page-container">
        {/* Contenido principal */}
        <div>
          {/* Header con título y badges */}
          <Card className="ticketD-header">
            <div className="ticketD-title">
              <h1 className="page-title">{ticket.title}</h1>
              <div className="badge-container">
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

            <p className="description">{ticket.description}</p>

            {/* Ubicación y fecha */}
            <div className="date-location-container">
              <div className="location-container">
                <div className="location-title">Ubicación</div>
                <div className="location-address">{ticket.address}</div>
                <div className="location-zone">Zona: {ticket.zone}</div>
              </div>

              <div className="date-container">
                <div className="date-title">Reportado</div>
                <div className="date">
                  {new Date(ticket.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="date-time">
                  {new Date(ticket.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Fotos */}
          {ticket.photos_before && ticket.photos_before.length > 0 && (
            <Card className="ticketD-photo-container">
              <h3 className="card-title">Fotos del Reporte</h3>
              <div>
                <img
                  className="current-photo"
                  src={ticket.photos_before[currentImageIndex]}
                  alt={`Foto ${currentImageIndex + 1}`}
                />
                {ticket.photos_before.length > 1 && (
                  <div className="carousell">
                    {ticket.photos_before.map((photo, index) => (
                      <img
                        className="carousell-miniature"
                        key={index}
                        src={photo}
                        alt={`Miniatura ${index + 1}`}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          border:
                            index === currentImageIndex
                              ? "3px solid var(--primary)"
                              : "3px solid transparent",
                          opacity: index === currentImageIndex ? 1 : 0.7,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Participantes */}
          <Card className="ticketD-participants">
            <h3 className="card-title">Participantes</h3>

            <div className="ticketD-participants-grid">
              {/* Reporter */}
              {reporter && (
                <div className="participant-card">
                  <Avatar
                    src={reporter.avatar}
                    alt={reporter.name}
                    size="medium"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="reported-by">Reportado por</div>
                    <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                      {reporter.username}
                    </div>
                  </div>
                  <Icon
                    icon="fluent:person-24-filled"
                    width="24"
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                </div>
              )}

              {/* Cleaner */}
              {cleaner && (
                <div className="participant-card">
                  <Avatar
                    src={cleaner.avatar}
                    alt={cleaner.username}
                    size="medium"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="reported-by">Aceptado por</div>
                    <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                      {cleaner.username}
                    </div>
                  </div>
                  <Icon
                    icon="fluent:person-24-filled"
                    width="24"
                    style={{ color: "var(--primary)", flexShrink: 0 }}
                  />
                </div>
              )}

              {!cleaner && (
                <div className="waiting-accept">
                  <Icon
                    icon="fluent:clock-24-regular"
                    width="32"
                    style={{ marginBottom: "var(--spacing-sm)" }}
                  />
                  <div>Esperando que alguien acepte este ticket</div>
                </div>
              )}
            </div>
          </Card>

          {/* Comentarios */}
          <Card className="comments-section">
            <h3 className="card-title">Comentarios ({comments.length})</h3>

            {comments.length === 0 ? (
              <p className="no-comments">
                No hay comentarios aún. Sé el primero en comentar.
              </p>
            ) : (
              <div className="comments-container">
                {comments.map((comment) => {
                  const commentUser = users.find(
                    (u) => u.id === comment.user_id
                  );
                  return (
                    <div className="comment-card" key={comment.id}>
                      {commentUser && (
                        <Avatar
                          src={commentUser.avatar}
                          alt={commentUser.name}
                          size="small"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <div className="comment-card-container">
                        <div className="commnet-info-container">
                          <span
                            style={{ fontWeight: 600, wordBreak: "break-word" }}
                          >
                            {comment.username || commentUser?.name || "Usuario"}
                          </span>
                          <span className="comment-date">
                            {new Date(comment.created_at).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Acciones */}
        <div className="ticketD-sidebar-container">
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
          <Card className="aditional-info-card">
            <h3 className="card-title">Información</h3>
            <div className="info-container">
              <div className="ticketD-info-line">
                <span style={{ color: "var(--text-muted)" }}>
                  <Icon
                    icon={TYPE_ICONS[ticket.type]}
                    width="16"
                    style={{ marginRight: "0.25rem" }}
                  />
                  Tipo
                </span>
                <span style={{ fontWeight: 500 }}>{ticket.type}</span>
              </div>
              <div className="ticketD-info-line">
                <span style={{ color: "var(--text-muted)" }}>
                  Tamaño estimado
                </span>
                <span style={{ fontWeight: 500 }}>{ticket.estimated_size}</span>
              </div>
              <div className="ticketD-info-line">
                <span style={{ color: "var(--text-muted)" }}>
                  <Icon
                    icon="fluent-emoji-flat:eye"
                    width="16"
                    style={{ marginRight: "0.25rem" }}
                  />
                  Vistas
                </span>
                <span style={{ fontWeight: 500 }}>
                  {ticket.interactions.views}
                </span>
              </div>
              {ticket.acceptedAt && (
                <div className="ticketD-info-line">
                  <span style={{ color: "var(--text-muted)" }}>
                    Aceptado el
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(ticket.acceptedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              )}
              {ticket.completedAt && (
                <div className="ticketD-info-line">
                  <span style={{ color: "var(--text-muted)" }}>
                    Completado el
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(ticket.completedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
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
        <div
          className="modal-overlay"
          onClick={() => setShowAcceptModal(false)}
        >
          <div
            className="modal modal-small"
            onClick={(e) => e.stopPropagation()}
          >
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
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginTop: "var(--spacing-md)",
                }}
              >
                Al aceptar, te comprometes a resolver este reporte y ganarás 20
                puntos.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowAcceptModal(false)}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={confirmAccept}>
                Sí, aceptar ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
