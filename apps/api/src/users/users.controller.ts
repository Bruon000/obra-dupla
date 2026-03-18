import { Body, Controller, Get, Patch, Param, Post, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.companyId, req.user.id, dto);
  }

  @Get()
  list(@Request() req: any) {
    return this.usersService.listByCompany(req.user.companyId, req.user.id);
  }

  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.companyId, req.user.id, id, dto);
  }
}
