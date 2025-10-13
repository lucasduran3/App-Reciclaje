// Estados de Tickets
export enum TicketStatus  {
  REPORTED= 'reported',      // Reportado, esperando ser aceptado
  ACCEPTED= 'accepted',      // Aceptado por un limpiador
  IN_PROGRESS= 'in_progress', // Limpieza en progreso
  VALIDATING= 'validating',  // Esperando validación
  COMPLETED= 'completed',    // Completado y validado
  REJECTED= 'rejected'       // Rechazado (validación fallida)
}

// Tipos de residuos
export enum TicketType  {
  GENERAL= 'general',        // Basura general
  RECYCLABLE= 'recyclable',  // Reciclables (papel, plástico, vidrio)
  ORGANIC= 'organic',        // Orgánicos
  ELECTRONIC= 'electronic',  // Electrónicos
  HAZARDOUS= 'hazardous',    // Peligrosos (pilas, químicos)
  BULKY= 'bulky'            // Voluminosos (muebles, etc.)
}

// Prioridades
export enum Priority  {
  LOW= 'low',
  MEDIUM= 'medium',
  HIGH= 'high',
  URGENT= 'urgent'
}

// Zonas de la ciudad
export enum Zones  {
  CENTER= 'Center',
  NORTH= 'North',
  SOUTH= 'South',
  EAST= 'East',
  WEST= 'West'
}

// Tipos de Misiones
export enum MissionType  {
  DAILY= 'daily',
  WEEKLY= 'weekly',
  SPECIAL= 'special'
}

// Categorías de Misiones
export enum MissionCategory  {
  REPORTER= 'reporter',      // Reportar tickets
  CLEANER= 'cleaner',        // Limpiar lugares
  VALIDATOR= 'validator',    // Validar limpiezas
  SOCIAL= 'social',          // Interacciones sociales
  STREAK= 'streak'           // Mantener rachas
}

// Tipos de Validación
export enum ValidationType  {
  QR= 'qr',                  // Escaneo QR en punto de acopio
  PHOTO= 'photo',            // Foto before/after
  REPORTER= 'reporter'       // Aprobación del reportante
}

export enum ValidationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Estado de Limpieza
export enum CleaningStatus  {
  PARTIAL= 'partial',        // Limpieza parcial
  COMPLETE= 'complete'       // Limpieza completa
}

// Niveles de Usuario
export const UserLevel = {
  NOVICE: { min: 0, max: 99, name: 'Novato' },
  APPRENTICE: { min: 100, max: 499, name: 'Aprendiz' },
  EXPERT: { min: 500, max: 1499, name: 'Experto' },
  MASTER: { min: 1500, max: 3999, name: 'Maestro' },
  LEGEND: { min: 4000, max: Infinity, name: 'Leyenda' }
} as const;

export type UserLevelKey = keyof typeof UserLevel;

// Multiplicadores de Puntos
export const PointsMultiplier = {
  TICKET_REPORT: 50,
  TICKET_ACCEPT: 20,
  TICKET_COMPLETE_PARTIAL: 100,
  TICKET_COMPLETE_FULL: 200,
  TICKET_VALIDATE: 30,
  MISSION_COMPLETE: 1,
  STREAK_BONUS: 10,
  LIKE_RECEIVED: 5,
  COMMENT_RECEIVED: 10
} as const;

export type PointsMultiplierKey = keyof typeof PointsMultiplier;


// Recompensas por Rachas
export const StreakRewards: Record<number, { points: number; badge: string }> = {
  3: { points: 50, badge: 'Constante' },
  7: { points: 150, badge: 'Comprometido' },
  14: { points: 350, badge: 'Dedicado' },
  30: { points: 1000, badge: 'Imparable' },
  60: { points: 2500, badge: 'Leyenda Verde' }
};

export default {
  TicketStatus,
  TicketType,
  Priority,
  Zones,
  MissionType,
  MissionCategory,
  ValidationType,
  ValidationStatus,
  CleaningStatus,
  UserLevel,
  PointsMultiplier,
  StreakRewards
};