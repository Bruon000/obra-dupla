import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";

@Injectable()
export class R2StorageService {
  private client: S3Client | null = null;
  private bucket: string = "";
  private publicBaseUrl: string = "";

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucket = process.env.R2_BUCKET_NAME?.trim();
    const publicUrl = process.env.R2_PUBLIC_URL?.trim();

    if (accountId && accessKey && secretKey && bucket && publicUrl) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        forcePathStyle: true,
      });
      this.bucket = bucket;
      this.publicBaseUrl = publicUrl.replace(/\/$/, "");
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.bucket.length > 0 && this.publicBaseUrl.length > 0;
  }

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
    const key = `${companyId}/${type}/${uuid}${ext}`;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      return null;
    }

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType || "application/octet-stream",
        }),
      );
      return `${this.publicBaseUrl}/${key}`;
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
