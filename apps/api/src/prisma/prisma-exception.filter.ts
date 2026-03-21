import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

function prismaKnownMessage(code: string): string {
  if (code === "P2022") {
    return "Esquema do banco desatualizado (coluna em falta). Rode prisma migrate deploy na base de produção.";
  }
  if (code === "P2002") return "Registro duplicado.";
  if (code === "P2025") return "Registro não encontrado.";
  return "Erro ao acessar o banco de dados.";
}

/**
 * Filtro único: trata HttpException, erros Prisma e o resto com log completo.
 * O Nest, sem isto, devolve só `{ message: "Internal server error" }` e esconde a causa.
 *
 * Para ver a mensagem real na resposta JSON (só em debug): EXPOSE_API_ERRORS=true no Render.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("HTTP");

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const req = host.switchToHttp().getRequest();
    const expose =
      String(process.env.EXPOSE_API_ERRORS ?? "").toLowerCase() === "true" ||
      String(process.env.EXPOSE_API_ERRORS ?? "") === "1";

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const json =
        typeof body === "object" && body !== null
          ? body
          : { statusCode: status, message: body };
      return res.status(status).json(json);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`${exception.code}: ${exception.message}`, exception.meta);
      const status =
        exception.code === "P2025"
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message: prismaKnownMessage(exception.code),
        prismaCode: exception.code,
      });
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(exception.message);
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Requisição inválida para o banco de dados.",
      });
    }

    // Ligação à BD, URL errada, SSL, etc.
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(exception.message, exception.errorCode);
      return res.status(500).json({
        statusCode: 500,
        message:
          "Não foi possível conectar ao PostgreSQL. Verifique DATABASE_URL no Render (e sslmode=require no Supabase, se aplicável).",
        code: "DB_INIT",
        ...(expose && { detail: exception.message }),
      });
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      this.logger.error(exception.message);
      return res.status(500).json({
        statusCode: 500,
        message: "Erro inesperado na consulta ao banco.",
        prismaCode: "UNKNOWN_QUERY",
        ...(expose && { detail: exception.message }),
      });
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      this.logger.error(exception.message);
      return res.status(500).json({
        statusCode: 500,
        message: "Erro interno do motor do banco (Prisma).",
        prismaCode: "RUST_PANIC",
      });
    }

    const err =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`${req?.method ?? "?"} ${req?.url ?? "?"} → ${err.message}`, err.stack);

    return res.status(500).json({
      statusCode: 500,
      message: expose
        ? err.message
        : "Internal server error",
      hint: expose
        ? undefined
        : "Veja os logs do serviço no Render. Para ver o erro na resposta JSON, defina EXPOSE_API_ERRORS=true (temporário).",
      ...(expose && { stack: err.stack }),
    });
  }
}
