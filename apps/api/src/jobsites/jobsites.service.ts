import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJobSiteDto } from "./dto/create-jobsite.dto";
import { UpdateJobSiteDto } from "./dto/update-jobsite.dto";

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  // aceita YYYY-MM-DD
  const iso = `${value}T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class JobSitesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.jobSite.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(companyId: string, id: string) {
    const found = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!found) throw new NotFoundException("Obra não encontrada");
    return found;
  }

  create(companyId: string, dto: CreateJobSiteDto) {
    return this.prisma.jobSite.create({
      data: {
        companyId,
        title: dto.title,
        address: dto.address ?? "",
        notes: dto.notes ?? "",
        status: dto.status ?? "EM_ANDAMENTO",
        startDate: parseDateOnly(dto.startDate),
        endDate: parseDateOnly(dto.endDate),
        saleValue: dto.saleValue ?? 0,
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateJobSiteDto) {
    const existing = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Obra não encontrada");

    return this.prisma.jobSite.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.address !== undefined ? { address: dto.address ?? "" } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? "" } : {}),
        ...(dto.status !== undefined ? { status: dto.status ?? "EM_ANDAMENTO" } : {}),
        ...(dto.startDate !== undefined ? { startDate: parseDateOnly(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: parseDateOnly(dto.endDate) } : {}),
        ...(dto.saleValue !== undefined ? { saleValue: dto.saleValue ?? 0 } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    const existing = await this.prisma.jobSite.findFirst({
      where: { companyId, id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Obra não encontrada");

    return this.prisma.jobSite.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

