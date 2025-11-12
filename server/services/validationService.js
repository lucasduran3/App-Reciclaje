/**
 * Validation Service - Validaciones de modelos
 */

import {
  isValidUUID,
  isValidEmail,
  isValidCoordinates,
} from "../utils/validators.js";

/**
 * Valida datos de usuario
 */
export function validateUser(user) {
  const errors = [];

  if (!user.name || user.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!user.email || !isValidEmail(user.email)) {
    errors.push("Invalid email format");
  }

  if (typeof user.points !== "number" || user.points < 0) {
    errors.push("Points must be a non-negative number");
  }

  if (!["Centro", "Norte", "Sur", "Este", "Oeste"].includes(user.zone)) {
    errors.push("Invalid zone");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida datos de ticket
 */
export function validateTicket(ticket) {
  const errors = [];

  if (
    !ticket.title ||
    ticket.title.trim().length < 10 ||
    ticket.title.trim() > 50
  ) {
    errors.push("El titulo debe tener entre 10 y 50 caracteres");
  }

  if (
    !ticket.description ||
    ticket.description.trim().length < 20 ||
    ticket.description.trim() > 300
  ) {
    errors.push("La descripción debe tener entre 20 y 300 caracteres");
  }

  if (
    !ticket.location ||
    !isValidCoordinates(ticket.location.lat, ticket.location.lng)
  ) {
    errors.push("Invalid location coordinates");
  }

  if (
    !ticket.type ||
    ![
      "general",
      "recyclable",
      "organic",
      "electronic",
      "hazardous",
      "bulky",
    ].includes(ticket.type)
  ) {
    errors.push("Tipo de residuo inválido");
  }

  if (
    !ticket.priority ||
    !["low", "medium", "high", "urgent"].includes(ticket.priority)
  ) {
    errors.push("Prioridad invalida");
  }

  if (
    !ticket.estimated_size ||
    !["small", "medium", "large", "xlarge"].includes(ticket.estimated_size)
  ) {
    errors.push("Tamaño estimado inválido");
  }

  if (!ticket.address || ticket.address.trim().length < 5) {
    errors.push("Dirección es requerida (mínimo 5 carácteres)");
  }

  if (!ticket.photos?.before || ticket.photos.before.length === 0) {
    errors.push("Foto del reporte es requerida");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida transición de estado de ticket
 */
export function validateTicketStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    reported: ["accepted"],
    accepted: ["in_progress", "reported"],
    in_progress: ["validating", "accepted"],
    validating: ["completed", "rejected"],
    completed: [],
    rejected: ["in_progress"],
  };

  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
    };
  }

  return { valid: true };
}

/**
 * Valida datos de comentario
 */
export function validateComment(comment) {
  const errors = [];

  if (!comment.content || comment.content.trim().length === 0) {
    errors.push("Content cannot be empty");
  }

  if (comment.content && comment.content.length > 500) {
    errors.push("Content must be less than 500 characters");
  }

  if (!comment.ticketId) {
    errors.push("Ticket ID is required");
  }

  if (!comment.userId) {
    errors.push("User ID is required");
  }

  return { valid: errors.length === 0, errors };
}
