import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanCreateJobSite(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { maxJobSites: true },
    });
    if (!company) {
      throw new ForbiddenException("Empresa não encontrada.");
    }
    const count = await this.prisma.jobSite.count({
      where: { companyId, deletedAt: null },
    });
    if (count >= company.maxJobSites) {
      throw new ForbiddenException(
        `Limite de obras atingido (${company.maxJobSites}). Entre em contato para ampliar o plano ou arquive obras antigas.`,
      );
    }
  }

  async assertCanCreateUser(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { maxUsers: true },
    });
    if (!company) {
      throw new ForbiddenException("Empresa não encontrada.");
    }
    const count = await this.prisma.user.count({ where: { companyId } });
    if (count >= company.maxUsers) {
      throw new ForbiddenException(
        `Limite de usuários atingido (${company.maxUsers}). Remova usuários inativos ou amplie o plano.`,
      );
    }
  }
}
