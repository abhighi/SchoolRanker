// ─────────────────────────────────────────────────────────────────────────
// Search algorithms
//
// This project deliberately implements classic algorithms by hand (rather than
// relying only on Array.prototype helpers) for teaching purposes:
//   • Sorting  — QuickSort / MergeSort in ./ranking.ts (used for GPA rankings)
//   • Searching — Binary Search below (used to look up a student by ID)
//
// Binary search runs in O(log n): it repeatedly halves a *sorted* range, so a
// list of 300 students is found in at most ~9 comparisons instead of up to 300
// for a linear scan.
// ─────────────────────────────────────────────────────────────────────────

// Case-insensitive, lexicographic comparison used by BOTH the sort and the
// search so their ordering stays consistent (required for binary search to be
// correct). Student IDs like "STU-0001".."STU-0300" are zero-padded, so
// lexicographic order matches numeric order.
function compareIds(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

/** Return a new array sorted ascending by `studentId`. */
export function sortByStudentId<T extends { studentId: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareIds(a.studentId, b.studentId));
}

export interface BinarySearchResult<T> {
  /** The matching item, or null if the id was not found. */
  result: T | null;
  /** How many comparisons the search made (demonstrates O(log n)). */
  steps: number;
}

/**
 * Binary search for an exact `studentId` within an array that has already been
 * sorted with {@link sortByStudentId}. Returns the match plus the number of
 * comparisons performed.
 */
export function binarySearchByStudentId<T extends { studentId: string }>(
  sorted: T[],
  targetId: string,
): BinarySearchResult<T> {
  const target = targetId.trim();
  let low = 0;
  let high = sorted.length - 1;
  let steps = 0;

  while (low <= high) {
    steps++;
    const mid = Math.floor((low + high) / 2);
    const cmp = compareIds(sorted[mid].studentId, target);
    if (cmp === 0) return { result: sorted[mid], steps };
    if (cmp < 0) low = mid + 1;
    else high = mid - 1;
  }

  return { result: null, steps };
}
