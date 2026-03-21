/**
 * Prisma devolve campos @db.Decimal como objeto Decimal; em alguns ambientes o Nest/Express
 * falha ao serializar a resposta JSON (500 genérico). Normalizamos para número.
 */
export function decimalToJsonNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "object" && value !== null) {
    const o = value as { toNumber?: () => number };
    if (typeof o.toNumber === "function") {
      try {
        const n = o.toNumber();
        if (Number.isFinite(n)) return n;
      } catch {
        /* ignore */
      }
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Converte um registo JobSite (Prisma) para payload JSON-safe. */
export function jobSiteToJson<T extends Record<string, unknown>>(row: T): T {
  return {
    ...row,
    saleValue: decimalToJsonNumber(row.saleValue, 0) as T["saleValue"],
    commissionValue: decimalToJsonNumber(row.commissionValue, 0) as T["commissionValue"],
    taxValue: decimalToJsonNumber(row.taxValue, 0) as T["taxValue"],
    otherClosingCosts: decimalToJsonNumber(row.otherClosingCosts, 0) as T["otherClosingCosts"],
  };
}
