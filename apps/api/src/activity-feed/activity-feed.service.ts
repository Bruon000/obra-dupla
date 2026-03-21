import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const MAX_PAYLOAD_STR = 6000;
const MAX_PAYLOAD_DEPTH = 10;

/** Evita JSON gigante na resposta (auditoria pode ter gravado base64 em payload). */
function sanitizePayloadForApi(value: unknown, depth = 0): unknown {
  if (depth > MAX_PAYLOAD_DEPTH) return "[profundidade-máxima]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length <= MAX_PAYLOAD_STR) return value;
    return `${value.slice(0, 3000)}… [truncado ${value.length} caracteres]`;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((x) => sanitizePayloadForApi(x, depth + 1));
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const keys = Object.keys(o);
    for (let i = 0; i < Math.min(keys.length, 60); i++) {
      const k = keys[i];
      out[k] = sanitizePayloadForApi(o[k], depth + 1);
    }
    if (keys.length > 60) out._truncado = `${keys.length - 60} chaves omitidas`;
    return out;
  }
  return value;
}

@Injectable()
export class ActivityFeedService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    userId: string,
    eventType: string,
    entityType: string,
    entityId: string,
    payload: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
  ): Promise<void> {
    await this.prisma.activityEvent.create({
      data: {
        companyId,
        userId,
        eventType,
        entityType,
        entityId,
        payload,
      },
    });
  }

  async listByEntity(companyId: string, entityType: string, entityId: string) {
    const rows = await this.prisma.activityEvent.findMany({
      where: {
        companyId,
        entityType,
        entityId,
      },
      take: 80,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return rows.map((r) => ({
      ...r,
      payload: sanitizePayloadForApi(r.payload),
    }));
  }
}
