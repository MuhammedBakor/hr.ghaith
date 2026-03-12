/**
 * Auto-generate sequential codes like COMP001, BR002, DEPT003, etc.
 * @param prefix - The prefix for the code (e.g., "COMP", "BR", "DEPT")
 * @param existingItems - Array of existing items that have a `code` property
 * @param digits - Number of digits for the numeric part (default: 3)
 */
export function generateNextCode(
  prefix: string,
  existingItems: { code?: string }[],
  digits = 3
): string {
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
  let maxNum = 0;
  for (const item of existingItems) {
    const match = item.code?.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(digits, '0')}`;
}
