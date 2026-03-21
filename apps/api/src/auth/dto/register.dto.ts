import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  adminName!: string;

  @IsEmail({ require_tld: false })
  email!: string;

  @IsString()
  @MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  password!: string;
}
