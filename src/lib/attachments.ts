import type { ExpenseAttachment, JobSiteDocument } from '@/types';

type DownloadableFile = Pick<ExpenseAttachment, "fileName" | "mimeType" | "fileDataBase64"> & {
  fileUrl?: string | null;
};

/** URL pública válida para o browser em produção (não localhost / loopback). */
export function isUsableRemoteFileUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") return false;
    return true;
  } catch {
    return false;
  }
}

export function attachmentToDataUrl(att: DownloadableFile): string | null {
  if (att.fileUrl && isUsableRemoteFileUrl(att.fileUrl)) return att.fileUrl;
  if (!att.fileDataBase64) return null;
  return `data:${att.mimeType || "application/octet-stream"};base64,${att.fileDataBase64}`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToExpenseAttachment(file: File): Promise<ExpenseAttachment> {
  const fileDataBase64 = await fileToBase64(file);
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileDataBase64,
  };
}

export function openAttachment(att: DownloadableFile) {
  if (att.fileUrl && isUsableRemoteFileUrl(att.fileUrl)) {
    window.open(att.fileUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (!att.fileDataBase64) return;
  const dataUrl = `data:${att.mimeType};base64,${att.fileDataBase64}`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  if (att.mimeType.startsWith("image/")) {
    w.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" alt="${att.fileName}" />`);
  } else {
    w.location.href = dataUrl;
  }
}

export function downloadAttachment(att: DownloadableFile) {
  if (att.fileUrl && isUsableRemoteFileUrl(att.fileUrl)) {
    const a = document.createElement("a");
    a.href = att.fileUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = att.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  if (!att.fileDataBase64) return;
  const dataUrl = `data:${att.mimeType};base64,${att.fileDataBase64}`;
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = att.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
