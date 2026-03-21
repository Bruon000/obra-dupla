import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

/**
 * Regista erros Prisma e devolve JSON com `prismaCode` (útil no Render / Network tab).
 * P2022 = coluna em falta → correr migrações na BD de produção.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaKnownRequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("Prisma");

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    this.logger.error(`${exception.code}: ${exception.message}`, exception.meta);

    const res = host.switchToHttp().getResponse();
    const status =
      exception.code === "P2025"
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Erro ao acessar o banco de dados.";
    if (exception.code === "P2022") {
      message =
        "Esquema do banco desatualizado (coluna em falta). Rode prisma migrate deploy na base de produção.";
    } else if (exception.code === "P2002") {
      message = "Registro duplicado.";
    } else if (exception.code === "P2025") {
      message = "Registro não encontrado.";
    }

    res.status(status).json({
      statusCode: status,
      message,
      prismaCode: exception.code,
    });
  }
}

@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("PrismaValidation");

  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    this.logger.error(exception.message);
    const res = host.switchToHttp().getResponse();
    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Requisição inválida para o banco de dados.",
    });
  }
}
