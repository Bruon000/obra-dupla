import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ActivityFeedService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    userId: string,
    eventType: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
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
    return this.prisma.activityEvent.findMany({
      where: {
        companyId,
        entityType,
        entityId,
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
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
