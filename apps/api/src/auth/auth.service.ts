import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { verifyPassword, hashPassword } from "../users/users.service";
import * as crypto from "node:crypto";
import type { RegisterDto } from "./dto/register.dto";

const JWT_SECRET = process.env.JWT_SECRET || "obra-dupla-dev-secret-change-in-production";
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function sign(payload: object): string {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${enc(header)}.${enc(payload)}`)
    .digest("base64url");
  return `${enc(header)}.${enc(payload)}.${signature}`;
}

function verify(token: string): { sub: string; email: string; companyId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");
    if (parts[2] !== expected) return null;
    if (!payload.sub || !payload.companyId) return null;
    return { sub: payload.sub, email: payload.email || "", companyId: payload.companyId };
  } catch {
    return null;
  }
}

export { verify as verifyJwt };

type AuthUserRow = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private issueAuthResponse(user: AuthUserRow) {
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
    };
    const access_token = sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        role: user.role,
      },
    };
  }

  private async assertCompanyAllowsLogin(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { billingStatus: true, trialEndsAt: true },
    });
    if (!company) {
      throw new UnauthorizedException("Organização não encontrada.");
    }
    if (company.billingStatus === "internal") {
      return;
    }
    if (company.billingStatus === "canceled") {
      throw new UnauthorizedException("Assinatura cancelada. Entre em contato com o suporte.");
    }
    if (company.billingStatus === "past_due") {
      throw new UnauthorizedException("Pagamento pendente. Regularize a assinatura para continuar.");
    }
    if (
      company.billingStatus === "trialing" &&
      company.trialEndsAt &&
      company.trialEndsAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException(
        "Período de teste encerrado. Assine para continuar usando o Canteiro.",
      );
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        role: true,
        passwordHash: true,
        disabledAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    const devPassword = process.env.DEV_USER_PASSWORD ?? "123456";
    const isDevUser = normalizedEmail === "dev@obradupla.local";

    const passwordOk = isDevUser
      ? password === devPassword || verifyPassword(password, user.passwordHash)
      : verifyPassword(password, user.passwordHash);

    if (!passwordOk) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    if (user.disabledAt) {
      throw new UnauthorizedException("Esta conta foi desativada. Contacte o administrador.");
    }

    if (!isDevUser) {
      await this.assertCompanyAllowsLogin(user.companyId);
    }

    return this.issueAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      role: user.role,
    });
  }

  async register(dto: RegisterDto) {
    const flag = (process.env.PUBLIC_REGISTRATION_ENABLED ?? "true").toLowerCase();
    if (flag === "false" || flag === "0") {
      throw new ForbiddenException("Cadastro público está desativado no momento.");
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Já existe uma conta com este e-mail.");
    }

    const trialDays = Number(process.env.TRIAL_DAYS ?? 14);
    const maxJobSites = Number(process.env.PLAN_FREE_MAX_JOBSITES ?? 5);
    const maxUsers = Number(process.env.PLAN_FREE_MAX_USERS ?? 5);
    const trialEndsAt = new Date(Date.now() + trialDays * 86400000);
    const passwordHash = hashPassword(dto.password);

    const created = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName.trim(),
          planSlug: "free",
          billingStatus: "trialing",
          trialEndsAt,
          maxJobSites,
          maxUsers,
        },
      });
      return tx.user.create({
        data: {
          companyId: company.id,
          email: normalizedEmail,
          passwordHash,
          name: dto.adminName.trim(),
          role: "ADMIN",
        },
        select: {
          id: true,
          email: true,
          name: true,
          companyId: true,
          role: true,
        },
      });
    });

    return this.issueAuthResponse(created);
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, companyId: true, role: true, disabledAt: true },
    });
  }
}
