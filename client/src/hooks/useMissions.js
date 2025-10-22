import { useState, useEffect } from 'react';
import missionService from '../services/missionService';
import { useAuth } from '../context/AuthContext';

export function useMissions(filters = {}) {
  const { currentUser } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMissions();
  }, [JSON.stringify(filters), currentUser?.id]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pasar userId para obtener el progreso del usuario
      const response = await missionService.getAll(filters, currentUser?.id);
      setMissions(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading missions:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshMissions = () => {
    loadMissions();
  };

  const incrementProgress = async (missionId, amount = 1) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await missionService.incrementProgress(
        missionId,
        currentUser.id,
        amount
      );
      
      // Actualizar misiones localmente
      setMissions(prev =>
        prev.map(m =>
          m.id === missionId
            ? { ...m, ...response.data.userProgress }
            : m
        )
      );
      
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    missions,
    loading,
    error,
    refreshMissions,
    incrementProgress,
  };
}