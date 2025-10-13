/**
 * ID Generator - Generador de IDs únicos
 */

import { randomBytes } from 'crypto';

/**
 * Genera un UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (randomBytes(1)[0] % 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un ID con prefijo
 * @param {string} prefix - Prefijo (ej: 'user', 'ticket')
 * @returns {string} ID con formato prefix-XXX
 */
export function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}${random}`;
}