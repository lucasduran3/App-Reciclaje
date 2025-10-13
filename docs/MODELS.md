# Documentación Completa de Modelos de Datos

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [UserProfile](#userprofile)
3. [Ticket](#ticket)
4. [Mission](#mission)
5. [Comment](#comment)
6. [LeaderboardEntry](#leaderboardentry)
7. [AcopioPoint](#acopiopoint)
8. [RootData](#rootdata)
9. [Relaciones Entre Modelos](#relaciones-entre-modelos)
10. [Reglas de Negocio](#reglas-de-negocio)

---

## Visión General

La estructura de datos está diseñada para soportar un sistema gamificado de limpieza urbana donde los usuarios:

- **Reportan** puntos sucios (tickets)
- **Aceptan** tickets de otros para limpiar
- **Completan** limpiezas y suben evidencia
- **Validan** el trabajo de otros
- **Ganan puntos** y suben de nivel
- **Completan misiones** diarias y semanales
- **Compiten** en rankings locales y globales

---

## UserProfile

### Descripción
Representa a un jugador del sistema con todo su progreso, estadísticas y configuración.

### Campos Obligatorios

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `id` | `string` | UUID único | Formato UUID v4 |
| `name` | `string` | Nombre completo | 2-50 caracteres |
| `email` | `string` | Email único | Formato email válido |
| `avatar` | `string` | URL del avatar | URL válida |
| `points` | `number` | Puntos totales | >= 0 |
| `level` | `number` | Nivel actual | 1-9 (calculado) |
| `streak` | `number` | Días consecutivos | >= 0 |
| `lastActivityDate` | `string` | Última actividad | ISO 8601 date (YYYY-MM-DD) |
| `zone` | `ZoneType` | Zona de residencia | Centro, Norte, Sur, Este, Oeste |
| `stats` | `UserStats` | Estadísticas detalladas | Objeto requerido |
| `badges` | `string[]` | Insignias obtenidas | Array (puede estar vacío) |
| `preferences` | `UserPreferences` | Configuración | Objeto requerido |
| `createdAt` | `string` | Fecha de registro | ISO 8601 timestamp |

### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `updatedAt` | `string` | Última modificación del perfil |

### Subobjetos

#### UserStats
```typescript
{
  ticketsReported: number      // Total reportados
  ticketsAccepted: number      // Total aceptados para limpiar
  ticketsCleaned: number       // Total completados con validación
  ticketsValidated: number     // Total validados de otros
  missionsCompleted: number    // Total de misiones completadas
  likesGiven: number           // Likes dados a otros
  likesReceived: number        // Likes recibidos
  commentsGiven: number        // Comentarios escritos
  commentsReceived: number     // Comentarios recibidos
}