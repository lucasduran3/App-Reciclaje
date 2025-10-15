export function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Valida formato de email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida coordenadas GPS
 */
export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Valida fecha ISO 8601
 */
export function isValidISODate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
}

/**
 * Sanitiza string (trim y limita longitud)
 */
export function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Valida que un objeto tenga campos requeridos
 */
export function hasRequiredFields(obj, requiredFields) {
  return requiredFields.every(field => obj.hasOwnProperty(field));
}