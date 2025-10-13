/**
 * Ticket - Reporte de punto sucio
 * 
 * Ciclo de vida completo de un reporte: desde que se reporta hasta
 * que se valida la limpieza y se otorgan puntos.
 * 
 * FLUJO DE ESTADOS:
 * reported → accepted → in_progress → validating → completed
 *                                                 ↓
 *                                             rejected (vuelve a in_progress)
 */

import { Zones, TicketType, TicketStatus, Priority, CleaningStatus, ValidationType, ValidationStatus } from "../constants/enums";

export interface Ticket {
  // Identificación
  id: string;                      // UUID único del ticket
  
  // Información básica
  title: string;                   // Título descriptivo (max 100 chars)
  description: string;             // Descripción detallada (max 500 chars)
  
  // Ubicación
  location: TicketLocation;
  zone: Zones;                  // Zona calculada automáticamente desde lat/lng
  
  // Clasificación
  type: TicketType;                // Tipo de residuo
  priority: Priority;         // Prioridad (calculada por tipo y tamaño)
  estimatedSize: TicketSize;       // Tamaño estimado del trabajo
  
  // Estado y participantes
  status: TicketStatus;            // Estado actual del ticket
  reportedBy: string;              // ID del usuario que reportó
  acceptedBy: string | null;       // ID del usuario que aceptó limpiar (null hasta aceptar)
  validatedBy: string | null;      // ID del usuario que validó (null hasta validar)
  
  // Evidencia fotográfica
  photos: TicketPhotos;
  
  // Validación
  validation: TicketValidation;
  
  // Resultado de limpieza
  cleaningStatus: CleaningStatus | null;  // null hasta completar limpieza
  
  // Puntos otorgados (null hasta completar)
  pointsAwarded: PointsAwarded | null;
  
  // Interacciones sociales
  interactions: TicketInteractions;
  
  // Timestamps
  createdAt: string;               // ISO 8601 timestamp de creación
  updatedAt: string;               // ISO 8601 timestamp de última actualización
  acceptedAt: string | null;       // ISO 8601 timestamp cuando fue aceptado
  completedAt: string | null;      // ISO 8601 timestamp cuando fue completado
}

export interface TicketLocation {
  lat: number;                     // Latitud (-90 a 90)
  lng: number;                     // Longitud (-180 a 180)
  address: string;                 // Dirección legible (calculada por geocoding inverso)
}

export interface TicketPhotos {
  before: string[];                // URLs de fotos antes de limpieza (mín 1, máx 5)
  after: string[];                 // URLs de fotos después (vacío hasta completar, máx 5)
}

export interface TicketValidation {
  type: ValidationType | null;     // Tipo de validación elegida (null hasta iniciar)
  status: ValidationStatus | null; // Estado de validación (null hasta iniciar)
  qrCode: string | null;           // Código QR del punto de acopio (null si no aplica)
  validatedAt: string | null;      // ISO 8601 timestamp de validación
  rejectionReason?: string;        // Motivo de rechazo (opcional, solo si rejected)
}

export interface PointsAwarded {
  cleaner: number;                 // Puntos para el limpiador
  reporter: number;                // Puntos para el reportante
  validator: number;               // Puntos para el validador
}

export interface TicketInteractions {
  likes: number;                   // Total de likes recibidos
  comments: number;                // Total de comentarios
  views: number;                   // Vistas del ticket (incrementa al abrir detalle)
  likedBy: string[];               // IDs de usuarios que dieron like
}

// Enums y tipos

export type TicketSize = 'small' | 'medium' | 'large' | 'xlarge';

// Transiciones de estado válidas
export const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  reported: [TicketStatus.ACCEPTED],
  accepted: [TicketStatus.IN_PROGRESS, TicketStatus.REPORTED], // puede volver a reported si limpiador cancela
  in_progress: [TicketStatus.VALIDATING, TicketStatus.ACCEPTED], // puede volver a accepted si no completa
  validating: [TicketStatus.COMPLETED, TicketStatus.REJECTED],
  completed: [], // estado final
  rejected: [TicketStatus.IN_PROGRESS], // puede reintentar
};

// Multiplicadores de puntos
export const POINTS_CONFIG = {
  REPORT: 50,
  ACCEPT: 20,
  CLEAN_PARTIAL: 100,
  CLEAN_COMPLETE: 200,
  VALIDATE: 30,
  
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