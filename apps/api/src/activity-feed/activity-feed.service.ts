import { Injectable } from "@nestjs/common";

@Injectable()
export class ActivityFeedService {
  async create(
    companyId: string,
    userId: string,
    eventType: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // TODO: persistir evento (ex.: tabela ActivityEvent ou outro storage)
  }
}
