import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  password!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  role?: string;
}
