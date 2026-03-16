import { db } from "./schema";

export function makeRepo<T extends { id: string }>(tableName: keyof typeof db) {
  const table = (db as any)[tableName];

  return {
    async put(row: T) {
      return table.put(row);
    },
    async bulkPut(rows: T[]) {
      return table.bulkPut(rows);
    },
    async get(id: string) {
      return table.get(id);
    },
    async delete(id: string) {
      return table.delete(id);
    },
    async toArray() {
      return table.toArray();
    },
  };
}
