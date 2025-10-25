import { useState, useEffect, useCallback } from 'react';
import ticketService from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

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
      console.error('Error loading tickets:', err);
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
      setTickets(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const acceptTicket = async (ticketId, userId) => {
    try {
      const response = await ticketService.accept(ticketId, userId);
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? response.data : t
      ));
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const likeTicket = async (ticketId, userId) => {
    try {
      const response = await ticketService.like(ticketId, userId);
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? response.data : t
      ));
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
      setError(err.message || 'Error loading ticket');
      console.error('Error loading ticket:', err);
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
      setError('Error al dar like');
      console.error('Error toggling like:', err);
    }
  };

  const addComment = async (text) => {
    if (!currentUser || !ticket || !text.trim()) return;

    try {
      await ticketService.addComment(ticket.id, currentUser.id, text);
      await loadTicket(); // Recargar para obtener comentarios actualizados
    } catch (err) {
      setError('Error al añadir comentario');
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const acceptTicket = async () => {
    if (!currentUser || !ticket) return;

    if (ticket.status !== 'reported' && ticket.status !== 'rejected') {
      throw new Error('El ticket no puede ser aceptado en su estado actual');
    }

    try {
      const response = await ticketService.accept(ticket.id, currentUser.id);
      setTicket(response.data);
      return response.data;
    } catch (err) {
      setError('Error al aceptar ticket');
      console.error('Error accepting ticket:', err);
      throw err;
    }
  };

  // Helpers
  const isLikedByUser = ticket && currentUser 
    ? ticket.interactions.liked_by.includes(currentUser.id)
    : false;

  const canAccept = ticket && currentUser 
    ? (ticket.status === 'reported' || ticket.status === 'rejected') && 
      ticket.reported_by !== currentUser.id
    : false;


  const canValidate = ticket && currentUser
    ? ticket.status === 'validating' && 
      (ticket.reported_by === currentUser.id || currentUser.role === 'admin')
    : false;

  return {
    ticket,
    loading,
    error,
    toggleLike,
    addComment,
    acceptTicket,
    refresh: loadTicket,
    isLikedByUser,
    canAccept,
    canValidate
  };
}