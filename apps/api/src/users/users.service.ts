import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import * as crypto from "node:crypto";
import { ActivityFeedService } from "../activity-feed/activity-feed.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { TenantLimitsService } from "../tenant-limits/tenant-limits.service";

const SALT_LEN = 16;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LEN).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityFeed: ActivityFeedService,
    private readonly tenantLimits: TenantLimitsService,
  ) {}

  async create(companyId: string, actorUserId: string, dto: CreateUserDto) {
    await this.ensureAdminOrDeny(companyId, actorUserId, "USER_CREATE_DENIED");
    await this.tenantLimits.assertCanCreateUser(companyId);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Já existe um usuário com este e-mail.");
    }
    const passwordHash = hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? "member",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    await this.activityFeed.create(companyId, actorUserId, "USER_CREATED", "User", user.id, {
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return user;
  }

  async listByCompany(companyId: string, actorUserId: string) {
    // Somente admin pode ver/gerenciar usuários.
    await this.ensureAdminOrDeny(companyId, actorUserId, "USER_LIST_DENIED");
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  private async assertAdmin(actorUserId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });
    if (!actor || actor.role !== "ADMIN") {
      throw new ForbiddenException("Apenas admin pode editar usuários.");
    }
  }

  private async ensureAdminOrDeny(companyId: string, actorUserId: string, eventType: string) {
    const actor = await this.prisma.user.findFirst({
      where: { id: actorUserId, companyId },
      select: { role: true },
    });
    if (actor?.role === "ADMIN") return;

    try {
      await this.activityFeed.create(companyId, actorUserId, eventType, "User", actorUserId, {
        reason: "NOT_AUTHORIZED_TO_MANAGE_USERS",
        actorRole: actor?.role ?? null,
      });
    } catch {
      // best-effort
    }

    throw new ForbiddenException("Apenas admin pode gerenciar usuários.");
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async update(companyId: string, actorUserId: string, userId: string, dto: UpdateUserDto) {
    await this.ensureAdminOrDeny(companyId, actorUserId, "USER_UPDATE_DENIED");

    const existing = await this.prisma.user.findFirst({
      where: { companyId, id: userId },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });
    if (!existing) throw new NotFoundException("Usuário não encontrado.");

    const before = {
      name: existing.name,
      email: existing.email,
      role: existing.role,
    };

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = this.normalizeEmail(dto.email);
    if (dto.role !== undefined) data.role = dto.role.trim();
    if (dto.password !== undefined) {
      const passwordHash = hashPassword(dto.password);
      data.passwordHash = passwordHash;
    }

    // Não permitir request vazio (evita auditoria “fantasma”)
    if (Object.keys(data).length === 0) {
      return existing;
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, name: true, role: true, companyId: true, createdAt: true },
      });

      await this.activityFeed.create(companyId, actorUserId, "USER_UPDATED", "User", updated.id, {
        before,
        after: { name: updated.name, email: updated.email, role: updated.role },
      });

      return updated;
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new ConflictException("Já existe um usuário com este e-mail.");
      }
      throw e;
    }
  }
}
