import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async listCompaniesForSupport(actorRole: string | undefined) {
    if (actorRole !== "PLATFORM_SUPPORT") {
      throw new ForbiddenException("Apenas suporte pode listar empresas.");
    }

    return this.prisma.company.findMany({
      where: {},
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  }
}

