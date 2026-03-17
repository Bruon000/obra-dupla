import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.companyId, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.usersService.listByCompany(req.user.companyId);
  }
}
