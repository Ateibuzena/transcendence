// src/utils/id-generator.ts
import { randomBytes } from 'crypto';

/**
 * Genera un ID único para partidas
 */
export function generateMatchId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `match_${timestamp}_${random}`;
}

/**
 * Genera un ID único para usuarios (si no usas UUID)
 */
export function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(12).toString('hex');
  return `user_${timestamp}_${random}`;
}