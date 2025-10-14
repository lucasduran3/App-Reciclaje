import { useState, useEffect } from 'react';
import ticketService from '../services/ticketService';

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
        t.id === ticketId ? response.data.ticket : t
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