import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { AuthService, verifyJwt } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  async use(req: any, res: any, next: any) {
    const rawPath: string = req.path || req.url || "";
    const path = rawPath.toString();

    // Libera todas as rotas de autenticação (com ou sem barra inicial)
    if (path.startsWith("/auth") || path.startsWith("auth")) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ statusCode: 401, message: "Não autorizado. Faça login." });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ statusCode: 401, message: "Token inválido ou expirado." });
    }

    const user = await this.authService.getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ statusCode: 401, message: "Usuário não encontrado." });
    }

    req.user = user;

    // Modo "suporte somente leitura" (PLATFORM_SUPPORT).
    // - Para qualquer rota fora de /support, o backend exige o header `X-Support-Company-Id`.
    // - Mesmo para GET, o tenant alvo é isolado alterando o effective companyId em `req.user.companyId`.
    // - Para métodos de escrita (POST/PATCH/DELETE/PUT), bloqueia com auditoria.
    const isPlatformSupport = String(user.role) === "PLATFORM_SUPPORT";
    if (isPlatformSupport) {
      const supportCompanyHeader = String(req.headers["x-support-company-id"] ?? "").trim();
      const isSupportRoute = path.startsWith("/support");

      if (!isSupportRoute && !supportCompanyHeader) {
        return res.status(403).json({ statusCode: 403, message: "Modo suporte requer X-Support-Company-Id." });
      }

      if (supportCompanyHeader) {
        const targetCompany = await this.prisma.company.findFirst({
          where: { id: supportCompanyHeader },
          select: { id: true },
        });
        if (!targetCompany) {
          return res.status(403).json({ statusCode: 403, message: "companyId do suporte inválido." });
        }

        // Mantém contexto para auditoria e para logs.
        req.supportContext = {
          originalCompanyId: user.companyId,
          targetCompanyId: supportCompanyHeader,
        };

        // Reaproveita o isolamento existente do código ao sobrescrever companyId efetivo.
        req.user.companyId = supportCompanyHeader;
      }

      const method = String(req.method ?? "").toUpperCase();
      const isWrite =
        method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT";

      if (!isSupportRoute && isWrite) {
        const targetCompanyId = req.supportContext?.targetCompanyId ?? user.companyId;
        await this.activityFeed.create(targetCompanyId, user.id, "SUPPORT_WRITE_DENIED", "Company", targetCompanyId, {
          method,
          path,
          reason: "SUPPORT_ONLY_READ",
          originalCompanyId: req.supportContext?.originalCompanyId ?? null,
        });
        return res.status(403).json({ statusCode: 403, message: "Acesso em modo suporte é somente leitura." });
      }

      if (!isSupportRoute && method === "GET") {
        const targetCompanyId = req.supportContext?.targetCompanyId ?? user.companyId;
        const shouldAuditRead =
          path.startsWith("/jobsites") ||
          path.startsWith("/job-costs") ||
          path.startsWith("/job-cost-attachments") ||
          path.startsWith("/job-site-members") ||
          path.startsWith("/job-site-documents") ||
          path.startsWith("/activity-feed") ||
          path.startsWith("/users");

        if (shouldAuditRead) {
          await this.activityFeed.create(targetCompanyId, user.id, "SUPPORT_READ", "Company", targetCompanyId, {
            path,
            method,
            originalCompanyId: req.supportContext?.originalCompanyId ?? null,
          });
        }
      }
    }
    next();
  }
}
