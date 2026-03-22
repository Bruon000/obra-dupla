import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { JobSiteDocument } from "@/types";
import type { ExpenseAttachment } from "@/types";
import { Button } from "@/components/ui/button";
import { downloadAttachment, isUsableRemoteFileUrl } from "@/lib/attachments";
import { getJobCostAttachment, getJobSiteDocument } from "@/lib/api";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

type Downloadable = Pick<ExpenseAttachment, "fileName" | "mimeType" | "fileDataBase64"> & { fileUrl?: string | null };
type Props = {
  attachment: Downloadable | JobSiteDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttachmentPreviewDialog({ attachment, open, onOpenChange }: Props) {
  const [iframeBlobUrl, setIframeBlobUrl] = useState<string | null>(null);
  const [resolvedAttachment, setResolvedAttachment] = useState<Downloadable | JobSiteDocument | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const effective = resolvedAttachment ?? attachment;

  const dataUrl = useMemo(() => {
    if (!effective) return null;
    const fileUrl = (effective as any).fileUrl;
    const fileDataBase64 = (effective as any).fileDataBase64;
    const thumbnailBase64 = (effective as any).thumbnailBase64;
    const mimeType = (effective as any).mimeType as string | undefined;
    if (fileUrl && isUsableRemoteFileUrl(fileUrl as string)) return fileUrl as string;
    if (fileDataBase64) return `data:${mimeType || "application/octet-stream"};base64,${fileDataBase64}`;
    // Só miniatura no banco (comum em fotos) — ainda dá prévia; PDF precisa de URL ou bytes completos.
    if (thumbnailBase64 && mimeType?.startsWith("image/")) {
      return `data:${mimeType};base64,${thumbnailBase64}`;
    }
    return null;
  }, [effective]);

  const mimeType = (effective as any)?.mimeType as string | undefined;
  const fileName = (effective as any)?.fileName as string | undefined;

  const isImage = !!mimeType && mimeType.startsWith("image/");
  const useIframe = !isImage && !!dataUrl;

  const attId = attachment?.id;
  const attFileUrl = (attachment as any)?.fileUrl as string | null | undefined;
  const attFileData = (attachment as any)?.fileDataBase64 as string | null | undefined;
  const attJobSiteId = (attachment as any)?.jobSiteId as string | null | undefined;
  const attUrlUsable = attFileUrl && isUsableRemoteFileUrl(attFileUrl);

  // Busca detalhe quando a lista só tem metadados (sem fileUrl nem base64 completo).
  // Miniatura sozinha não basta para baixar o arquivo original — ainda buscamos o detalhe.
  // fileUrl antigo (localhost) conta como "sem URL" — tentamos GET para ver se há base64/R2 na API.
  useEffect(() => {
    if (!open) {
      setResolvedAttachment(null);
      setResolveError(null);
      setResolveLoading(false);
      return;
    }
    if (!attId) {
      setResolvedAttachment(null);
      return;
    }
    if (attUrlUsable || attFileData) {
      setResolvedAttachment(null);
      return;
    }

    let cancelled = false;
    setResolveLoading(true);
    setResolveError(null);
    setResolvedAttachment(null);
    (async () => {
      try {
        const full =
          attJobSiteId != null && String(attJobSiteId).length > 0
            ? await getJobSiteDocument(attId)
            : await getJobCostAttachment(attId);
        if (!cancelled) setResolvedAttachment(full as Downloadable | JobSiteDocument);
      } catch (e: unknown) {
        if (!cancelled) {
          setResolveError(e instanceof Error ? e.message : "Falha ao carregar anexo");
          setResolvedAttachment(null);
        }
      } finally {
        if (!cancelled) setResolveLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, attId, attUrlUsable, attFileData, attJobSiteId]);

  // Data URL em iframe costuma ficar preto (PDF e outros). Usar blob URL para qualquer anexo no iframe.
  useEffect(() => {
    if (!open || !useIframe || !(effective as any)?.fileDataBase64) {
      if (iframeBlobUrl) {
        URL.revokeObjectURL(iframeBlobUrl);
        setIframeBlobUrl(null);
      }
      return;
    }
    let url: string | null = null;
    try {
      const base64 = (effective as any).fileDataBase64 as string;
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
  }, [open, useIframe, effective, mimeType]);

  useEffect(() => {
    if (!open && iframeBlobUrl) {
      URL.revokeObjectURL(iframeBlobUrl);
      setIframeBlobUrl(null);
    }
  }, [open, iframeBlobUrl]);

  const openInNewTab = () => {
    if (dataUrl) window.open(dataUrl, "_blank", "noopener,noreferrer");
  };

  const rawFileUrl = (effective as any)?.fileUrl as string | undefined;
  const iframeSrc = (rawFileUrl && isUsableRemoteFileUrl(rawFileUrl) ? rawFileUrl : null) || iframeBlobUrl;

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
            {resolveLoading && !dataUrl ? (
              <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Carregando prévia…</p>
              </div>
            ) : resolveError && !dataUrl ? (
              <div className="text-sm text-muted-foreground p-6 text-center space-y-3">
                <p>{resolveError}</p>
                {effective ? (
                  <Button type="button" variant="outline" onClick={() => downloadAttachment(effective as any)} className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                ) : null}
              </div>
            ) : dataUrl && isImage ? (
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
                    {effective && (
                      <Button type="button" variant="default" size="sm" onClick={() => downloadAttachment(effective as any)} className="gap-2">
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground p-6 text-center space-y-3">
                <p>Não foi possível gerar prévia. Use o botão Baixar ou reenvie o comprovante (arquivos antigos de teste podem não ter link na nuvem).</p>
                {effective && (
                  <Button type="button" variant="outline" onClick={() => downloadAttachment(effective as any)} className="gap-2">
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
            {effective ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadAttachment(effective as any)}
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
