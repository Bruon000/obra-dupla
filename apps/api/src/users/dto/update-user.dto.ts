import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Mantemos simples: o frontend/back pode mandar "ADMIN" ou "member".
  // (O modelo atual não restringe role, então aqui também não bloqueamos.)
  @IsOptional()
  @IsString()
  role?: string;

  // Se informado, faz reset de senha.
  @IsOptional()
  @IsString()
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  password?: string;

  /** true = bloqueia login; false = reativa. Só admin (via update). */
  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}

