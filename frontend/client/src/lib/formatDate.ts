/**
 * Safe date formatting — returns fallback on invalid input
 */
export function formatDate(value: unknown, fallback = '—'): string {
  if (!value) return fallback;
  try {
    const d = new Date(value as string | number);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return fallback;
  }
}

export function formatDateTime(value: unknown, fallback = '—'): string {
  if (!value) return fallback;
  try {
    const d = new Date(value as string | number);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return fallback;
  }
}
