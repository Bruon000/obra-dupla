import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { JobSiteDocument } from "@/types";
import type { ExpenseAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { downloadAttachment } from "@/lib/attachments";
import { Download, ExternalLink } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

type Downloadable = Pick<ExpenseAttachment, "fileName" | "mimeType" | "fileDataBase64"> & { fileUrl?: string | null };
type Props = {
  attachment: Downloadable | JobSiteDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttachmentPreviewDialog({ attachment, open, onOpenChange }: Props) {
  const [iframeBlobUrl, setIframeBlobUrl] = useState<string | null>(null);

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
  const useIframe = !isImage && !!dataUrl;

  // Data URL em iframe costuma ficar preto (PDF e outros). Usar blob URL para qualquer anexo no iframe.
  useEffect(() => {
    if (!open || !useIframe || !(attachment as any)?.fileDataBase64) {
      if (iframeBlobUrl) {
        URL.revokeObjectURL(iframeBlobUrl);
        setIframeBlobUrl(null);
      }
      return;
    }
    let url: string | null = null;
    try {
      const base64 = (attachment as any).fileDataBase64 as string;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
      url = URL.createObjectURL(blob);
      setIframeBlobUrl(url);
    } catch {
      setIframeBlobUrl(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
      setIframeBlobUrl(null);
    };
  }, [open, useIframe, attachment, mimeType]);

  useEffect(() => {
    if (!open && iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
      setIframeBlobUrl(null);
    }
  }, [open, iframeBlobUrl]);

  const openInNewTab = () => {
    if (dataUrl) window.open(dataUrl, "_blank", "noopener,noreferrer");
  };

  const iframeSrc = (attachment as any)?.fileUrl || iframeBlobUrl;

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

          <div className="w-full min-h-[200px] bg-muted/30 rounded-md flex items-center justify-center overflow-hidden">
            {dataUrl && isImage ? (
              <img src={dataUrl} alt={fileName ?? "arquivo"} className="w-full max-h-[70vh] object-contain rounded-md border border-border" />
            ) : useIframe ? (
              iframeSrc ? (
                <iframe
                  key={iframeSrc}
                  title={fileName ?? "Arquivo"}
                  src={iframeSrc}
                  className="w-full rounded-md border border-border bg-background"
                  style={{ height: "70vh" }}
                />
              ) : (
                <div className="w-full p-6 flex flex-col items-center justify-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Use &quot;Abrir em nova aba&quot; ou &quot;Baixar&quot; para visualizar o arquivo.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button type="button" variant="outline" size="sm" onClick={openInNewTab} className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Abrir em nova aba
                    </Button>
                    {attachment && (
                      <Button type="button" variant="default" size="sm" onClick={() => downloadAttachment(attachment as any)} className="gap-2">
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground p-6 text-center space-y-3">
                <p>Não foi possível gerar prévia. Use o botão Baixar para abrir no seu dispositivo.</p>
                {attachment && (
                  <Button type="button" variant="outline" onClick={() => downloadAttachment(attachment as any)} className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {useIframe && dataUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={openInNewTab} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Abrir em nova aba
              </Button>
            )}
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

