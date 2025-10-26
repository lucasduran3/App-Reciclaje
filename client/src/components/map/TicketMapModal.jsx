/**
 * TicketMapModal - Modal que muestra información del ticket en el mapa
 * Ubicación: client/src/components/map/TicketMapModal.jsx
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import Badge from "../common/Badge";

const STATUS_CONFIG = {
  reported: {
    variant: "warning",
    label: "Reportado",
    icon: <Icon icon="fluent-color:megaphone-loud-32" />,
  },
  accepted: {
    variant: "info",
    label: "Aceptado",
    icon: <Icon icon="fluent-color:circle-multiple-hint-checkmark-48" />,
  },
  in_progress: {
    variant: "primary",
    label: "En progreso",
    icon: <Icon icon="fluent-color:arrow-clockwise-dashes-32" />,
  },
  validating: {
    variant: "secondary",
    label: "Validando",
    icon: <Icon icon="fluent-color:people-sync-16" />,
  },
  completed: {
    variant: "success",
    label: "Completado",
    icon: <Icon icon="fluent-color:checkmark-circle-48" />,
  },
  rejected: {
    variant: "danger",
    label: "Rechazado",
    icon: <Icon icon="fluent-color:dismiss-circle-32" />,
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

export default function TicketMapModal({ ticket, onClose, users = [] }) {
  const navigate = useNavigate();

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!ticket) return null;

  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.reported;
  const priorityConfig =
    PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
  const reporter = users.find((u) => u.id === ticket.reported_by);
  const cleaner = ticket.accepted_by
    ? users.find((u) => u.id === ticket.accepted_by)
    : null;

  const handleViewMore = () => {
    navigate(`/tickets/${ticket.id}`);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="map-modal-overlay" onClick={handleOverlayClick}>
      <div className="map-modal">
        {/* Header */}
        <div className="map-modal-header">
          <div className="map-modal-badges">
            <Badge variant={statusConfig.variant} icon={statusConfig.icon}>
              {statusConfig.label}
            </Badge>
            <Badge
              variant={priorityConfig.variant}
              icon={<Icon icon="fluent:flag-24-filled" width="16" />}
            >
              {priorityConfig.label}
            </Badge>
          </div>
          <button
            className="map-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <Icon icon="fluent:dismiss-24-filled" width="24" />
          </button>
        </div>

        {/* Body */}
        <div className="map-modal-body">
          {/* Imagen */}
          {ticket.photos_before && ticket.photos_before.length > 0 && (
            <div className="map-modal-image">
              <img
                src={ticket.photos_before[0]}
                alt={ticket.title}
                loading="lazy"
              />
            </div>
          )}

          {/* Contenido */}
          <div className="map-modal-content">
            <h3 className="map-modal-title">{ticket.title}</h3>

            <p className="map-modal-description">
              {ticket.description.length > 150
                ? `${ticket.description.substring(0, 150)}...`
                : ticket.description}
            </p>

            {/* Metadata */}
            <div className="map-modal-metadata">
              <div className="map-modal-meta-item">
                <Icon icon="fluent-color:location-24" width="18" />
                <span>{ticket.address || ticket.zone}</span>
              </div>

              <div className="map-modal-meta-item">
                <Icon icon={TYPE_ICONS[ticket.type]} width="18" />
                <span>{ticket.type}</span>
              </div>

              <div className="map-modal-meta-item">
                <Icon icon="fluent-color:calendar-24" width="18" />
                <span>
                  {new Date(ticket.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Participantes */}
            {(reporter || cleaner) && (
              <div className="map-modal-participants">
                {reporter && (
                  <div className="map-modal-participant">
                    <img
                      src={reporter.avatar}
                      alt={reporter.name}
                      className="map-modal-avatar"
                    />
                    <div>
                      <div className="map-modal-participant-label">
                        Reportado por
                      </div>
                      <div className="map-modal-participant-name">
                        {reporter.name}
                      </div>
                    </div>
                  </div>
                )}

                {cleaner && (
                  <div className="map-modal-participant">
                    <img
                      src={cleaner.avatar}
                      alt={cleaner.name}
                      className="map-modal-avatar"
                    />
                    <div>
                      <div className="map-modal-participant-label">
                        Aceptado por
                      </div>
                      <div className="map-modal-participant-name">
                        {cleaner.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interacciones */}
            <div className="map-modal-interactions">
              <span>
                <Icon icon="fluent-color:heart-32" width="18" />
                {ticket.interactions.likes}
              </span>
              <span>
                <Icon icon="fluent-color:comment-multiple-16" width="18" />
                {ticket.interactions.comments}
              </span>
              <span>
                <Icon icon="fluent-emoji-flat:eye" width="18" />
                {ticket.interactions.views}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="map-modal-footer">
          <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={handleViewMore}
            icon={<Icon icon="fluent:arrow-right-24-filled" width="18" />}
            style={{ flex: 2 }}
          >
            Ver más detalles
          </Button>
        </div>
      </div>
    </div>
  );
}
