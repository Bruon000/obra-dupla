import { Injectable } from "@nestjs/common";
import { R2StorageService } from "./r2-storage.service";
import { SupabaseStorageService } from "../supabase/supabase-storage.service";

/**
 * Serviço unificado: usa R2 se configurado, senão Supabase Storage, senão retorna null (grava base64 no banco).
 */
@Injectable()
export class AttachmentStorageService {
  constructor(
    private readonly r2: R2StorageService,
    private readonly supabase: SupabaseStorageService,
  ) {}

  isConfigured(): boolean {
    return this.r2.isConfigured() || this.supabase.isConfigured();
  }

  async uploadBase64(
    companyId: string,
    type: "cost" | "doc",
    fileName: string,
    mimeType: string,
    base64: string,
    id?: string,
  ): Promise<string | null> {
    if (this.r2.isConfigured()) {
      const url = await this.r2.uploadBase64(companyId, type, fileName, mimeType, base64, id);
      if (url) return url;
    }
    if (this.supabase.isConfigured()) {
      const url = await this.supabase.uploadBase64(companyId, type, fileName, mimeType, base64, id);
      if (url) return url;
    }
    return null;
  }
}
