/**
 * Streak Service - Servicio de gestión de rachas
 */

// Recompensas por rachas
const STREAK_REWARDS = {
  3: { points: 50, badge: 'Constante' },
  7: { points: 150, badge: 'Comprometido' },
  14: { points: 350, badge: 'Dedicado' },
  30: { points: 1000, badge: 'Imparable' },
  60: { points: 2500, badge: 'Leyenda Verde' },
};

/**
 * Actualiza la racha de un usuario
 * @param {Object} user - Usuario a actualizar
 * @param {string} activityDate - Fecha de actividad (YYYY-MM-DD)
 * @returns {Object} { streak, pointsAwarded, badgeAwarded }
 */
export function updateStreak(user, activityDate = new Date().toISOString().split('T')[0]) {
  const lastDate = new Date(user.lastActivityDate);
  const currentDate = new Date(activityDate);
  
  // Calcular diferencia en días
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let pointsAwarded = 0;
  let badgeAwarded = null;

  if (diffDays === 1) {
    // Día consecutivo - incrementar racha
    user.streak++;
    
    // Verificar recompensas
    const reward = STREAK_REWARDS[user.streak];
    if (reward) {
      pointsAwarded = reward.points;
      
      // Agregar badge si no lo tiene
      if (!user.badges.includes(reward.badge)) {
        user.badges.push(reward.badge);
        badgeAwarded = reward.badge;
      }
    }
  } else if (diffDays === 0) {
    // Mismo día - no cambiar racha
    return { streak: user.streak, pointsAwarded: 0, badgeAwarded: null };
  } else if (diffDays > 1) {
    // Racha rota - reiniciar
    user.streak = 1;
  }

  user.lastActivityDate = activityDate;

  return {
    streak: user.streak,
    pointsAwarded,
    badgeAwarded,
  };
}

/**
 * Verifica si un usuario tiene racha activa
 */
export function hasActiveStreak(user) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = new Date(user.lastActivityDate);
  const currentDate = new Date(today);
  
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 1;
}