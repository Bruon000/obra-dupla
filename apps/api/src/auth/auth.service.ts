import { UnauthorizedException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { verifyPassword } from "../users/users.service";
import * as crypto from "node:crypto";

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

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }
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

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, companyId: true, role: true },
    });
  }
}
