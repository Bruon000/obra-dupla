import { Controller, Get } from "@nestjs/common";

/** Respostas públicas para testar se o serviço no Render está acordado (sem JWT). */
@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      ok: true,
      service: "canteiro-api",
      /** Render injeta em deploys Git; útil para confirmar qual revisão está no ar. */
      commit: process.env.RENDER_GIT_COMMIT ?? null,
    };
  }

  @Get("health")
  health() {
    return { ok: true, commit: process.env.RENDER_GIT_COMMIT ?? null };
  }
}
