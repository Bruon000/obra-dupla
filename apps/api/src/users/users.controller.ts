import { Body, Controller, Delete, Get, Patch, Param, Post, Request } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeOwnPasswordDto } from "./dto/change-own-password.dto";

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

  /** Troca de senha pelo próprio utilizador (sócio ou admin), sem precisar de admin. */
  @Patch("me/password")
  changeOwnPassword(@Request() req: any, @Body() dto: ChangeOwnPasswordDto) {
    return this.usersService.changeOwnPassword(req.user.companyId, req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Patch(":id")
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.companyId, req.user.id, id, dto);
  }

  /** Remove o utilizador da empresa (revoga login). Só admin; não pode remover a si próprio nem o único admin. */
  @Delete(":id")
  remove(@Request() req: any, @Param("id") id: string) {
    return this.usersService.remove(req.user.companyId, req.user.id, id);
  }
}
