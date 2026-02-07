/**
 * Grade calculation helper functions
 * Centralized logic for computing percentage and letter grades
 */

/**
 * Calculate percentage from score and maxScore
 * @returns percentage value (0-100) or null if invalid
 */
export function calculatePercentage(score: number | null | undefined, maxScore: number): number | null {
  if (score === null || score === undefined || maxScore === 0) return null;
  return (score / maxScore) * 100;
}

/**
 * Derive letter grade from percentage
 * @returns letter grade (A+ to F) or null if percentage is null
 */
export function getLetterGrade(percentage: number | null): string | null {
  if (percentage === null) return null;
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Grade points for GPA calculation (4.0 scale)
 */
export const gradePoints: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};
