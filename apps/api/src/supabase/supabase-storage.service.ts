import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "attachments";

@Injectable()
export class SupabaseStorageService {
  private client: SupabaseClient | null = null;

  constructor() {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false },
      });
    }
  }

  /** Retorna true se o Storage está configurado (env definido). */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Envia arquivo em base64 para o bucket e retorna a URL pública.
   * Se não configurado ou falhar, retorna null (caller grava base64 no banco).
   */
  async uploadBase64(
    companyId: string,
    type: "cost" | "doc",
    fileName: string,
    mimeType: string,
    base64: string,
    id?: string,
  ): Promise<string | null> {
    if (!this.client) return null;

    const ext = this.getExtension(fileName, mimeType);
    const uuid = id ?? randomUUID();
    const path = `${companyId}/${type}/${uuid}${ext}`;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      return null;
    }

    const { error } = await this.client.storage.from(BUCKET).upload(path, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: true,
    });

    if (error) return null;

    const {
      data: { publicUrl },
    } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return publicUrl;
  }

  /** Remove arquivo do bucket (opcional; usado ao deletar anexo). */
  async removeByUrl(url: string): Promise<void> {
    if (!this.client) return;
    try {
      const path = this.pathFromPublicUrl(url);
      if (path) await this.client.storage.from(BUCKET).remove([path]);
    } catch {
      // best-effort
    }
  }

  private pathFromPublicUrl(publicUrl: string): string | null {
    try {
      const u = new URL(publicUrl);
      const match = u.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private getExtension(fileName: string, mimeType: string): string {
    if (fileName?.includes(".")) {
      const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
      if (ext.length <= 6) return ext;
    }
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
    };
    return map[mimeType?.toLowerCase()] ?? ".bin";
  }
}
