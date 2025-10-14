import { useState, useEffect } from 'react';
import leaderboardService from '../services/leaderboardService';

export function useLeaderboard(filters = {}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [JSON.stringify(filters)]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaderboardService.get(filters);
      setLeaderboard(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboard = () => {
    loadLeaderboard();
  };

  return {
    leaderboard,
    loading,
    error,
    refreshLeaderboard,
  };
}