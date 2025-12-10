/**
 * Loan configuration constants
 * These can be moved to environment variables or a settings table later
 */
export const LOAN_CONFIG = {
  DEFAULT_LOAN_DAYS: 14,
  MAX_RENEWALS: 2,
  RENEWAL_DAYS: 14,
  MAX_ACTIVE_LOANS: 5,
} as const;

/**
 * Calculate due date based on loan duration
 */
export function calculateDueDate(loanDurationDays: number = LOAN_CONFIG.DEFAULT_LOAN_DAYS): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + loanDurationDays);
  return dueDate;
}

/**
 * Check if a loan is overdue
 */
export function isOverdue(dueAt: Date, returnedAt: Date | null): boolean {
  if (returnedAt) return false;
  return new Date() > dueAt;
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(dueAt: Date): number {
  const now = new Date();
  if (now <= dueAt) return 0;
  const diffTime = now.getTime() - dueAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}