import { Injectable, NestMiddleware } from "@nestjs/common";
import { AuthService, verifyJwt } from "./auth.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: any, res: any, next: any) {
    const path = req.path || req.url;
    if (path.startsWith("/auth/")) {
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
    next();
  }
}
