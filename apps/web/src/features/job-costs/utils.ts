export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

export function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachmentPayload(file: File) {
  const fileDataBase64 = await toBase64(file);
  const isImage = file.type.startsWith("image/");
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    storageType: "inline" as const,
    fileDataBase64,
    thumbnailBase64: isImage ? fileDataBase64 : null,
  };
}
