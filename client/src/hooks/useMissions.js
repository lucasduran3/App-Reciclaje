import { useState, useEffect } from 'react';
import missionService from '../services/missionService';

export function useMissions(filters = {}) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMissions();
  }, [JSON.stringify(filters)]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await missionService.getAll(filters);
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

  const incrementProgress = async (missionId, userId, amount = 1) => {
    try {
      const response = await missionService.incrementProgress(missionId, userId, amount);
      setMissions(prev => prev.map(m => 
        m.id === missionId ? response.data : m
      ));
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