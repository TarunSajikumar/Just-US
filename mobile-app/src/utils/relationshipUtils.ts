/**
 * relationshipUtils.ts
 *
 * Single source of truth for all relationship date calculations.
 * All values are derived dynamically from `relationshipStartedAt`.
 * No anniversary date is ever stored separately.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RelationshipStats {
  daysTogether: number;
  yearsTogether: number;
  nextAnniversaryDate: Date;
  nextAnniversaryFormatted: string;
  daysUntilAnniversary: number;
  startDateFormatted: string;
}

// ─── Core Utilities ──────────────────────────────────────────────────────────

/**
 * Returns the number of full days since the relationship started.
 * Always ≥ 0.
 */
export function getDaysTogether(startDate?: string | Date | null): number {
  if (!startDate) return 0;
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 0;
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

/**
 * Returns the number of full years since the relationship started.
 * Always ≥ 0.
 */
export function getYearsTogether(startDate?: string | Date | null): number {
  if (!startDate) return 0;
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      years -= 1;
    }
    return Math.max(0, years);
  } catch {
    return 0;
  }
}

/**
 * Calculates the next upcoming anniversary date.
 *
 * - If today IS the anniversary: returns today (0 days to go).
 * - If the anniversary already passed this year: returns next year's date.
 * - Otherwise: returns this year's anniversary date.
 *
 * The countdown is never negative.
 */
export function getNextAnniversary(startDate?: string | Date | null): Date | null {
  if (!startDate) return null;
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Build this year's anniversary
    const thisYear = now.getFullYear();
    const candidate = new Date(thisYear, start.getMonth(), start.getDate());
    candidate.setHours(0, 0, 0, 0);

    // If the anniversary is today or in the future, use it; otherwise use next year
    if (candidate >= now) {
      return candidate;
    } else {
      return new Date(thisYear + 1, start.getMonth(), start.getDate());
    }
  } catch {
    return null;
  }
}

/**
 * Returns the number of days until the next anniversary.
 * Always ≥ 0.
 */
export function getDaysUntilAnniversary(startDate?: string | Date | null): number {
  if (!startDate) return 0;
  try {
    const next = getNextAnniversary(startDate);
    if (!next) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = next.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a date as "8 September 2025" (en-GB long format).
 */
export function formatRelationshipDate(date?: Date | string | null): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Returns all derived relationship stats in one call.
 * Returns null if startDate is missing or invalid.
 */
export function getRelationshipStats(
  startDate?: string | Date | null
): RelationshipStats | null {
  if (!startDate) return null;

  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    const nextAnniversaryDate = getNextAnniversary(start);
    if (!nextAnniversaryDate) return null;

    return {
      daysTogether: getDaysTogether(start),
      yearsTogether: getYearsTogether(start),
      nextAnniversaryDate,
      nextAnniversaryFormatted: formatRelationshipDate(nextAnniversaryDate),
      daysUntilAnniversary: getDaysUntilAnniversary(start),
      startDateFormatted: formatRelationshipDate(start),
    };
  } catch {
    return null;
  }
}
