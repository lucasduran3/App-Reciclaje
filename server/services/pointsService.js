/**
 * Points Service - Servicio de cálculo de puntos
 */

import supabaseService from "./supabaseService.js";
import { updateStreak } from "./streakService.js";

// Configuración de puntos base
const POINTS_CONFIG = {
  REPORT: 50,
  ACCEPT: 20,
  CLEAN_PARTIAL: 100,
  CLEAN_COMPLETE: 200,
  VALIDATE: 30,
  LIKE_RECEIVED: 5,
  COMMENT_RECEIVED: 10,
  STREAK_BONUS: 10,

  // Multiplicadores por prioridad
  PRIORITY_MULTIPLIER: {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
    urgent: 2.0,
  },

  // Multiplicadores por tamaño
  SIZE_MULTIPLIER: {
    small: 1.0,
    medium: 1.3,
    large: 1.6,
    xlarge: 2.0,
  },
};

const userStats = [
  "tickets_cleaned",
  "tickets_reported",
  "tickets_accepted",
  "tickets_reported",
  "tickets_validated",
];

/**
 * Setea las stats del usuario
 */
export async function updateUserPoints(userId, points, statToUpdate) {
  if (typeof points !== "number") {
    throw new Error("Los puntos deben ser un número");
  }

  const user = await supabaseService.getById("profiles", userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const newPoints = user.points + points;
  const newLevel = calculateLevel(newPoints);
  const newStreak = updateStreak(user);

  const stats = user.stats || {};

  if (statToUpdate && userStats.includes(statToUpdate)) {
    stats[statToUpdate] = (stats[statToUpdate] || 0) + 1;
  }

  const updatedUser = await supabaseService.update("profiles", userId, {
    points: newPoints + newStreak.pointsAwarded,
    level: newLevel,
    streak: newStreak.streak,
    last_activity_date: user.last_activity_date,
    badges: user.badges,
    stats: stats,
  });

  return updatedUser;
}

/**
 * Calcula puntos para reportar un ticket
 */
export function calculateReportPoints() {
  return POINTS_CONFIG.REPORT;
}

/**
 * Calcula puntos para aceptar un ticket
 */
export function calculateAcceptPoints() {
  return POINTS_CONFIG.ACCEPT;
}

/**
 * Calcula puntos para completar limpieza
 */
export function calculateCleaningPoints(ticket) {
  const basePoints =
    ticket.cleaningStatus === "complete"
      ? POINTS_CONFIG.CLEAN_COMPLETE
      : POINTS_CONFIG.CLEAN_PARTIAL;

  const priorityMult =
    POINTS_CONFIG.PRIORITY_MULTIPLIER[ticket.priority] || 1.0;
  const sizeMult = POINTS_CONFIG.SIZE_MULTIPLIER[ticket.estimatedSize] || 1.0;

  return Math.round(basePoints * priorityMult * sizeMult);
}

/**
 * Calcula puntos para validar
 */
export function calculateValidationPoints() {
  return POINTS_CONFIG.VALIDATE;
}

/**
 * Calcula puntos totales a otorgar por ticket completado
 */
export function calculateTicketPoints(ticket) {
  return {
    cleaner: calculateCleaningPoints(ticket),
    reporter: calculateReportPoints(),
    validator: calculateValidationPoints(),
  };
}

/**
 * Calcula nivel desde puntos
 */
export function calculateLevel(points) {
  if (points < 100) return points < 50 ? 1 : 2;
  if (points < 500) return points < 300 ? 3 : 4;
  if (points < 1500) return points < 1000 ? 5 : 6;
  if (points < 4000) return points < 2500 ? 7 : 8;
  return 9;
}
