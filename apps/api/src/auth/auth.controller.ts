import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** Cadastro SaaS: cria Company + primeiro admin e retorna o mesmo payload do login. */
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
