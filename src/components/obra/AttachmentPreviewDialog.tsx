import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { JobSiteDocument } from "@/types";
import type { ExpenseAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { downloadAttachment } from "@/lib/attachments";
import { Download } from "lucide-react";
import { useMemo } from "react";

type Downloadable = Pick<ExpenseAttachment, "fileName" | "mimeType" | "fileDataBase64"> & { fileUrl?: string | null };
type Props = {
  attachment: Downloadable | JobSiteDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttachmentPreviewDialog({ attachment, open, onOpenChange }: Props) {
  const dataUrl = useMemo(() => {
    if (!attachment) return null;
    const fileUrl = (attachment as any).fileUrl;
    const fileDataBase64 = (attachment as any).fileDataBase64;
    const mimeType = (attachment as any).mimeType;
    if (fileUrl) return fileUrl as string;
    if (!fileDataBase64) return null;
    return `data:${mimeType || "application/octet-stream"};base64,${fileDataBase64}`;
  }, [attachment]);

  const mimeType = (attachment as any)?.mimeType as string | undefined;
  const fileName = (attachment as any)?.fileName as string | undefined;

  const isImage = !!mimeType && mimeType.startsWith("image/");
  const isPdf = !!mimeType && (mimeType === "application/pdf" || mimeType.includes("pdf"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base truncate">{fileName ?? "Anexo"}</DialogTitle>
            <DialogDescription>
              {mimeType ? `Tipo: ${mimeType}` : "Prévia no navegador"}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full">
            {dataUrl && isImage ? (
              <img src={dataUrl} alt={fileName ?? "arquivo"} className="w-full max-h-[70vh] object-contain rounded-md border border-border" />
            ) : dataUrl && (isPdf || !isImage) ? (
              <iframe
                title={fileName ?? "Arquivo"}
                src={dataUrl}
                className="w-full"
                style={{ height: "70vh", border: "1px solid var(--border)" }}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Não foi possível gerar prévia. Use o download para visualizar.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {attachment ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadAttachment(attachment as any)}
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

