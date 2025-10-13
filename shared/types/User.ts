/**
 * UserProfile - Perfil completo del jugador
 * 
 * Representa toda la información de un usuario, incluyendo progreso,
 * estadísticas, rachas y preferencias.
 */

import { Zones, UserLevel } from "../constants/enums";

export interface UserProfile {
  // Identificación
  id: string;                      // UUID único del usuario
  name: string;                    // Nombre completo
  email: string;                   // Email único (usado para login simulado)
  avatar: string;                  // URL del avatar (puede ser DiceBear API)
  
  // Progreso y gamificación
  points: number;                  // Puntos totales acumulados (>= 0)
  level: number;                   // Nivel calculado automáticamente desde puntos (1-99)
  streak: number;                  // Días consecutivos de actividad (>= 0)
  lastActivityDate: string;        // ISO 8601 date (YYYY-MM-DD) de última acción válida
  
  // Ubicación
  zone: Zones;                  // Zona de residencia del usuario
  
  // Estadísticas detalladas
  stats: UserStats;
  
  // Reconocimientos
  badges: string[];                // Array de nombres de insignias obtenidas
  
  // Configuración personal
  preferences: UserPreferences;
  
  // Metadatos
  createdAt: string;               // ISO 8601 timestamp de registro
  updatedAt?: string;              // ISO 8601 timestamp de última modificación (opcional)
}

export interface UserStats {
  ticketsReported: number;         // Total de tickets que reportó
  ticketsAccepted: number;         // Total de tickets que aceptó limpiar
  ticketsCleaned: number;          // Total de tickets que completó (limpieza validada)
  ticketsValidated: number;        // Total de tickets de otros que validó
  missionsCompleted: number;       // Total de misiones completadas
  likesGiven: number;              // Total de likes dados a otros tickets
  likesReceived: number;           // Total de likes recibidos en sus tickets
  commentsGiven: number;           // Total de comentarios escritos
  commentsReceived: number;        // Total de comentarios recibidos
}

export interface UserPreferences {
  notifications: boolean;          // Si recibe notificaciones (simuladas por ahora)
  publicProfile: boolean;          // Si su perfil es visible en leaderboard
  theme?: 'light' | 'dark';        // Tema de UI (opcional, por defecto light)
}

// Helper para calcular nivel desde puntos
export function calculateLevel(points: number): number {
  if (points < 100) return points < 50 ? 1 : 2;
  if (points < 500) return points < 300 ? 3 : 4;
  if (points < 1500) return points < 1000 ? 5 : 6;
  if (points < 4000) return points < 2500 ? 7 : 8;
  return 9;
}
