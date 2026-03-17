import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({ require_tld: false }) // permite dev@obradupla.local em desenvolvimento
  email!: string;

  @IsString()
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  password!: string;
}
