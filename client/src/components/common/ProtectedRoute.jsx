/**
 * Protected Route - CORREGIDO
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  // Mostrar loader mientras verifica sesión
  if (authLoading) {
    return <Loader fullScreen text="Verificando sesión..." />;
  }

  // Redirigir a login si no autenticado
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuario autenticado, renderizar children
  return children;
}