import { useState, useEffect, useCallback } from "react";
import ticketService from "../services/ticketService";
import { useAuth } from "../context/AuthContext";

/**
 * Hook para manejar múltiples tickets (lista)
 */
export function useTickets(filters = {}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTickets();
  }, [JSON.stringify(filters)]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getAll(filters);
      setTickets(response.data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = () => {
    loadTickets();
  };

  const createTicket = async (ticketData) => {
    try {
      const response = await ticketService.create(ticketData);
      setTickets((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const acceptTicket = async (ticketId, userId) => {
    try {
      const response = await ticketService.accept(ticketId, userId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? response.data : t))
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const likeTicket = async (ticketId, userId) => {
    try {
      const response = await ticketService.like(ticketId, userId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? response.data : t))
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    refreshTickets,
    createTicket,
    acceptTicket,
    likeTicket,
  };
}

/**
 * Hook para manejar un ticket individual (detalle)
 */
export function useTicket(ticketId) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const loadTicket = useCallback(async () => {
    if (!ticketId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getById(ticketId);
      setTicket(response.data);
    } catch (err) {
      setError(err.message || "Error loading ticket");
      console.error("Error loading ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const toggleLike = async () => {
    if (!currentUser || !ticket) return;

    try {
      const response = await ticketService.like(ticket.id, currentUser.id);
      setTicket(response.data);
    } catch (err) {
      setError("Error al dar like");
      console.error("Error toggling like:", err);
    }
  };

  const addComment = async (text) => {
    if (!currentUser || !ticket || !text.trim()) return;

    try {
      await ticketService.addComment(ticket.id, currentUser.id, text);
      await loadTicket(); // Recargar para obtener comentarios actualizados
    } catch (err) {
      setError("Error al añadir comentario");
      console.error("Error adding comment:", err);
      throw err;
    }
  };

  const acceptTicket = async () => {
    if (!currentUser || !ticket) return;

    if (ticket.status !== "reported" && ticket.status !== "rejected") {
      throw new Error("El ticket no puede ser aceptado en su estado actual");
    }

    try {
      const response = await ticketService.accept(ticket.id, currentUser.id);
      setTicket(response.data);
      return response.data;
    } catch (err) {
      setError("Error al aceptar ticket");
      console.error("Error accepting ticket:", err);
      throw err;
    }
  };

  const completeTicket = async (photoFile, cleaningStatus) => {
    if (!currentUser || !ticket) {
      throw new Error("Usuario o ticket no disponible");
    }

    if (!photoFile) {
      throw new Error("Foto es requerida");
    }

    if (!["partial", "complete"].includes(cleaningStatus)) {
      throw new Error("Estado de limpieza inválido");
    }

    // Validaciones de reglas de negocio
    if (ticket.accepted_by !== currentUser.id) {
      throw new Error("Solo el usuario que aceptó el ticket puede completarlo");
    }

    if (ticket.reported_by === currentUser.id) {
      throw new Error("No puedes completar tu propio ticket");
    }

    if (ticket.status !== "accepted" && ticket.status !== "in_progress") {
      throw new Error(
        `Ticket no puede ser completado en estado "${ticket.status}"`
      );
    }

    try {
      // Convertir foto a base64
      const photoBase64 = await ticketService.fileToBase64(photoFile);

      // Completar ticket vía servicio
      const response = await ticketService.complete(ticket.id, {
        photo_after: photoBase64,
        cleaning_status: cleaningStatus,
      });

      // Actualizar estado local con el ticket actualizado
      setTicket(response.data.ticket);

      return response.data; // Retorna { ticket, pointsAwarded }
    } catch (err) {
      setError("Error al completar ticket");
      console.error("Error completing ticket:", err);
      throw err;
    }
  };

  const validateTicket = async (approved, validationMessage = "") => {
    if (!currentUser || !ticket) {
      throw new Error("Usuario o ticket no disponible");
    }

    // Validaciones de reglas de negocio
    if (ticket.status !== "validating") {
      throw new Error(
        `Ticket no puede ser validado en estado "${ticket.status}"`
      );
    }

    if (ticket.reported_by !== currentUser.id) {
      throw new Error("Solo el reportante puede validar este ticket");
    }

    try {
      const response = await ticketService.validate(
        ticket.id,
        approved,
        validationMessage
      );

      // Actualizar estado local con el ticket actualizado
      setTicket(response.data.ticket || response.data);

      return response.data; // Retorna { ticket, pointsAwarded? }
    } catch (err) {
      setError("Error al validar ticket");
      console.error("Error validating ticket:", err);
      throw err;
    }
  };

  // Helpers
  const isLikedByUser =
    ticket && currentUser
      ? ticket.interactions.liked_by.includes(currentUser.id)
      : false;

  const canAccept =
    ticket && currentUser
      ? (ticket.status === "reported" || ticket.status === "rejected") &&
        ticket.reported_by !== currentUser.id
      : false;

  const canValidate =
    ticket && currentUser
      ? ticket.status === "validating" &&
        (ticket.reported_by === currentUser.id || currentUser.role === "admin")
      : false;

  const canComplete =
    ticket && currentUser
      ? ticket.status === "accepted" &&
        ticket.accepted_by === currentUser.id &&
        ticket.reported_by !== currentUser.id
      : false;

  return {
    ticket,
    loading,
    error,
    toggleLike,
    addComment,
    acceptTicket,
    completeTicket,
    validateTicket,
    refresh: loadTicket,
    isLikedByUser,
    canAccept,
    canValidate,
    canComplete,
  };
}
