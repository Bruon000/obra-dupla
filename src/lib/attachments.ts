import type { ExpenseAttachment } from '@/types';

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

export function openAttachment(att: ExpenseAttachment) {
  if (!att.fileDataBase64) return;
  const dataUrl = `data:${att.mimeType};base64,${att.fileDataBase64}`;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  if (att.mimeType.startsWith('image/')) {
    w.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" alt="${att.fileName}" />`);
  } else {
    w.location.href = dataUrl;
  }
}
