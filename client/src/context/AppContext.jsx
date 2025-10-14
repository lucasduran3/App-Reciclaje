/**
 * AppContext - Estado global de la aplicación
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAllData();
      setAppData(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading app data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadAppData();
  };

  const updateTickets = (tickets) => {
    setAppData(prev => ({ ...prev, tickets }));
  };

  const updateMissions = (missions) => {
    setAppData(prev => ({ ...prev, missions }));
  };

  const updateUsers = (users) => {
    setAppData(prev => ({ ...prev, users }));
  };

  const value = {
    appData,
    loading,
    error,
    refreshData,
    updateTickets,
    updateMissions,
    updateUsers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}