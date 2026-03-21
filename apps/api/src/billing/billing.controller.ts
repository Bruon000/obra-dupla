import { Controller, Get, NotFoundException, Request } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Endpoints para o frontend exibir plano, trial e limites (CTAs de upgrade no futuro).
 * Webhooks Stripe podem ser adicionados aqui depois (validar STRIPE_WEBHOOK_SECRET).
 */
@Controller("billing")
export class BillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("summary")
  async summary(@Request() req: any) {
    const companyId = req.user.companyId as string;

    const [company, jobSites, users] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          planSlug: true,
          billingStatus: true,
          trialEndsAt: true,
          maxJobSites: true,
          maxUsers: true,
          stripeCustomerId: true,
        },
      }),
      this.prisma.jobSite.count({ where: { companyId, deletedAt: null } }),
      this.prisma.user.count({ where: { companyId } }),
    ]);

    if (!company) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    return {
      companyName: company.name,
      planSlug: company.planSlug,
      billingStatus: company.billingStatus,
      trialEndsAt: company.trialEndsAt,
      limits: {
        maxJobSites: company.maxJobSites,
        maxUsers: company.maxUsers,
        usedJobSites: jobSites,
        usedUsers: users,
      },
      stripeEnabled: Boolean(company.stripeCustomerId),
    };
  }
}
