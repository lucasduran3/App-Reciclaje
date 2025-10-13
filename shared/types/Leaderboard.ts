/**
 * LeaderboardEntry - Entrada en el ranking
 * 
 * Representa la posición de un usuario en el leaderboard global o por zona.
 * Se regenera periódicamente desde los datos de usuarios.
 */

import { Zones } from "../constants/enums";

export interface LeaderboardEntry {
  userId: string;                  // ID del usuario
  name: string;                    // Nombre (desnormalizado)
  avatar: string;                  // Avatar (desnormalizado)
  points: number;                  // Puntos totales
  zone: Zones;                     // Zona del usuario
  position: number;                // Posición en el ranking (1-indexed)
  level: number;                   // Nivel actual
  streak: number;                  // Racha actual
  weeklyPoints: number;            // Puntos ganados esta semana
  badges: string[];                // Insignias obtenidas
}

// Tipos de leaderboard
export type LeaderboardType = 'global' | 'zone';

export interface LeaderboardFilters {
  type: LeaderboardType;           // Global o por zona
  zone?: Zones;                   // Zona específica (requerido si type='zone')
  limit?: number;                // Cantidad de entradas a retornar (default: 100)
}