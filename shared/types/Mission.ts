/**
 * Mission - Misiones diarias/semanales/especiales
 * 
 * Representa tareas que los usuarios deben completar para ganar puntos extra.
 * Se actualizan automáticamente (diarias a las 3am, semanales los lunes).
 */

export interface Mission {
  // Identificación
  id: string;                      // UUID único de la misión
  
  // Información básica
  title: string;                   // Título corto (ej: "Reporta 3 puntos sucios")
  description: string;             // Descripción detallada de qué hacer
  icon: string;                    // Emoji o icono representativo
  
  // Tipo y categoría
  type: MissionType;               // Frecuencia: daily, weekly, special
  category: MissionCategory;       // Categoría temática
  
  // Progreso y recompensa
  goal: number;                    // Meta a alcanzar (ej: 5 tickets)
  progress: number;                // Progreso actual (0 a goal)
  points: number;                  // Puntos otorgados al completar
  completed: boolean;              // Si ya fue completada
  
  // Requisitos específicos (opcionales)
  requirements?: MissionRequirements;
  
  // Temporalidad
  expiresAt: string | null;        // ISO 8601 timestamp de expiración (null = sin expiración)
  createdAt: string;               // ISO 8601 timestamp de creación
  completedAt?: string;            // ISO 8601 timestamp de completado (opcional)
}


export interface MissionRequirements {
  // Requisitos para reportar tickets
  minPhotos?: number;              // Mínimo de fotos requeridas
  mustHaveLocation?: boolean;      // Debe incluir ubicación GPS
  ticketTypes?: TicketType[];      // Tipos específicos de ticket
  uniqueZones?: number;            // Cantidad de zonas diferentes requeridas
  
  // Requisitos para limpiar
  mustBeOthersTicket?: boolean;    // Debe ser ticket de otro usuario
  cleaningStatus?: CleaningStatus; // Estado de limpieza requerido
  
  // Requisitos para validar
  mustBeOwnTicket?: boolean;       // Debe ser ticket propio
  ticketStatus?: TicketStatus;     // Estado específico del ticket
  
  // Requisitos sociales
  likes?: number;                  // Cantidad de likes requeridos
  comments?: number;               // Cantidad de comentarios requeridos
  
  // Requisitos de racha
  consecutiveDays?: number;        // Días consecutivos requeridos
}

// Plantillas de misiones (usadas para regenerar diarias/semanales)
export const DAILY_MISSION_TEMPLATES: Omit<Mission, 'id' | 'progress' | 'completed' | 'createdAt' | 'expiresAt'>[] = [
  {
    title: 'Reportar un punto sucio',
    description: 'Encuentra y reporta un lugar que necesite limpieza en tu zona',
    icon: '📍',
    type: 'daily',
    category: 'reporter',
    points: 50,
    goal: 1,
    requirements: { minPhotos: 1, mustHaveLocation: true },
  },
  {
    title: 'Acepta un reto de limpieza',
    description: 'Acepta al menos un ticket reportado por otro usuario',
    icon: '✋',
    type: 'daily',
    category: 'cleaner',
    points: 30,
    goal: 1,
    requirements: { mustBeOthersTicket: true },
  },
  {
    title: 'Valida una limpieza',
    description: 'Valida un ticket que hayas reportado y fue limpiado',
    icon: '✅',
    type: 'daily',
    category: 'validator',
    points: 40,
    goal: 1,
    requirements: { mustBeOwnTicket: true, ticketStatus: 'validating' },
  },
];

export const WEEKLY_MISSION_TEMPLATES: Omit<Mission, 'id' | 'progress' | 'completed' | 'createdAt' | 'expiresAt'>[] = [
  {
    title: 'Limpiador Semanal',
    description: 'Completa la limpieza de 5 tickets esta semana',
    icon: '🧹',
    type: 'weekly',
    category: 'cleaner',
    points: 300,
    goal: 5,
    requirements: { cleaningStatus: 'complete' },
  },
  {
    title: 'Explorador Urbano',
    description: 'Reporta 10 puntos sucios en diferentes zonas',
    icon: '🔍',
    type: 'weekly',
    category: 'reporter',
    points: 250,
    goal: 10,
    requirements: { uniqueZones: 3 },
  },
  {
    title: 'Comunidad Activa',
    description: 'Da 20 likes y comenta en 5 tickets de otros usuarios',
    icon: '💬',
    type: 'weekly',
    category: 'social',
    points: 100,
    goal: 25,
    requirements: { likes: 20, comments: 5 },
  },
];