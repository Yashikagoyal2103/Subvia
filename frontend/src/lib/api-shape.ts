/**
 * Coerce any list-shaped API response into a plain array.
 * Returns [] when the shape is unrecognised — never throws.
 */
export function toArray<T>(input: unknown): T[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as T[];
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    for (const key of ["items", "data", "results", "rows", "records"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

export function isAxiosStatus(err: unknown, status: number): boolean {
  if (!err || typeof err !== "object") return false;
  const res = (err as { response?: { status?: unknown } }).response;
  return !!res && res.status === status;
}