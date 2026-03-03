/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ══════════════════════════════════════════════════════
// DB Result Type Helpers — بديل آمن لـ (result as any)
// ══════════════════════════════════════════════════════

/** نتيجة INSERT من MySQL/Drizzle */
export interface DbInsertResult {
  insertId: number;
  affectedRows: number;
  fieldCount?: number;
}

/** نتيجة UPDATE/DELETE من MySQL/Drizzle */
export interface DbMutationResult {
  affectedRows: number;
  changedRows?: number;
  fieldCount?: number;
}

/** استخراج insertId بأمان */
export function getInsertId(result: unknown): number {
  if (!result || !Array.isArray(result) || !result[0]) return 0;
  return (result[0] as DbInsertResult).insertId ?? 0;
}

/** استخراج affectedRows بأمان */
export function getAffectedRows(result: unknown): number {
  if (!result || !Array.isArray(result) || !result[0]) return 0;
  return (result[0] as DbMutationResult).affectedRows
      ?? (result[0] as any).rowsAffected
      ?? 0;
}
