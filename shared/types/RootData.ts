/**
 * RootData - Estructura raíz del archivo data.json
 * 
 * Contiene todas las colecciones de datos que persisten localmente.
 * Este es el schema completo del archivo JSON que el servidor lee/escribe.
 */

import { UserProfile } from './User';
import { Mission } from './Mission';
import { Ticket } from './Ticket';
import { Comment } from './Comment';
import { LeaderboardEntry } from './Leaderboard';

export interface RootData {
  // Colecciones principales
  users: UserProfile[];            // Todos los usuarios registrados
  tickets: Ticket[];               // Todos los tickets (reportados, en progreso, completados)
  missions: Mission[];             // Todas las misiones (diarias, semanales, especiales)
  comments: Comment[];             // Todos los comentarios en tickets
  leaderboard: LeaderboardEntry[]; // Ranking precalculado
  
  // Puntos de acopio (para validación QR)
  acopioPoints: AcopioPoint[];
  
  // Metadatos
  metadata: DataMetadata;
}

export interface AcopioPoint {
  id: string;                      // UUID único del punto de acopio
  name: string;                    // Nombre del punto
  location: {
    lat: number;                   // Latitud
    lng: number;                   // Longitud
    address: string;               // Dirección legible
  };
  qrCode: string;                  // Código QR único para validación
  acceptedTypes: TicketType[];     // Tipos de residuos que acepta
  zone: Zones;                  // Zona donde está ubicado
  schedule: string;                // Horario de atención (texto libre)
  active: boolean;                 // Si está operativo actualmente
}

export interface DataMetadata {
  lastUpdated: string;             // ISO 8601 timestamp de última modificación
  version: string;                 // Versión del schema (semver)
  totalUsers: number;              // Total de usuarios registrados
  totalTickets: number;            // Total de tickets creados
  totalMissions: number;           // Total de misiones
  activeTickets: number;           // Tickets no completados
}

// Tipos importados
import { TicketType, Zones } from '../constants/enums';