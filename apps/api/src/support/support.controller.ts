import { Controller, Get, Request } from "@nestjs/common";
import { SupportService } from "./support.service";

@Controller("support")
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get("companies")
  listCompanies(@Request() req: any) {
    return this.supportService.listCompaniesForSupport(req.user?.role);
  }
}

