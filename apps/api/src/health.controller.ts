import { Controller, Get } from "@nestjs/common";

/** Respostas públicas para testar se o serviço no Render está acordado (sem JWT). */
@Controller()
export class HealthController {
  @Get()
  root() {
    return { ok: true, service: "canteiro-api" };
  }

  @Get("health")
  health() {
    return { ok: true };
  }
}
