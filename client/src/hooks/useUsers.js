import { useState, useEffect, useCallback } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

export function useUsers(filters = []) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [JSON.stringify(filters)]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getAll(filters);
      setUsers(response.data);
    } catch (error) {
      setError(error.message);
      console.error("Error loading users: ", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
  };
}
