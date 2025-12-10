/**
 * Reservation configuration constants
 */
export const RESERVATION_CONFIG = {
  // Reservation expiration in days (if not fulfilled)
  EXPIRATION_DAYS: 7,
  
  // Maximum number of pending reservations per user
  MAX_PENDING_RESERVATIONS: 5,
} as const;

/**
 * Calculate reservation expiration date
 */
export function calculateReservationExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + RESERVATION_CONFIG.EXPIRATION_DAYS);
  return expiry;
}

/**
 * Check if reservation is expired
 */
export function isReservationExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

