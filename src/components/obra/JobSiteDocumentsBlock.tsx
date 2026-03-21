import { useMemo, useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadAttachment } from "@/lib/attachments";
import type { JobSiteDocument, JobSiteDocumentCategory } from "@/types";
import { Search, Upload, Trash2, Download } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog";
import { ListPagination } from "./ListPagination";

const CATEGORIES: JobSiteDocumentCategory[] = ["CONTRATO", "PLANTA", "FOTO", "ALVARA", "NF", "RECIBO", "OUTROS"];

export function JobSiteDocumentsBlock(props: {
  jobSiteId: string;
  documents: JobSiteDocument[];
  isAdmin: boolean;
  currentUserId?: string;
  onUpload: (files: File[], category: string, title: string) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
}) {
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>("OUTROS");
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  // Este card fica na tela inicial; por isso, não é pra ficar despejando lista/paginação.
  // Mantemos a lista recolhida por padrão e só mostramos quando você clicar.
  const [showDocumentsList, setShowDocumentsList] = useState(false);

  // Este bloco aparece na tela inicial lado a lado com outros cards.
  // Mantemos uma página menor para não consumir muita altura quando tiver muitos documentos.
  const DOCUMENTS_PAGE_SIZE = 4;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.documents
      .filter((d) => (category ? d.category === category : true))
      .filter((d) => {
        if (!q) return true;
        return (
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      });
  }, [props.documents, category, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / DOCUMENTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * DOCUMENTS_PAGE_SIZE, safePage * DOCUMENTS_PAGE_SIZE),
    [filtered, safePage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Após upload/refresh, os novos documentos entram no topo.
  // Se o usuário estiver numa página diferente, parece que "não carregou".
  useEffect(() => {
    setPage(1);
  }, [props.documents.length, category, query]);

  const canDelete = (d: JobSiteDocument) => {
    if (props.isAdmin) return true;
    if (!props.currentUserId) return false;
    return d.uploadedByUserId === props.currentUserId;
  };

  const onFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      await props.onUpload(files, uploadCategory, uploadTitle.trim());
      setUploadTitle("");
      setUploadCategory("OUTROS");
      setQuery("");
      setCategory("");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-[220px]">
          <div className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground">DOSSIÊ TÉCNICO</div>
          <div className="mt-1 text-sm font-semibold">Preservados como evidência para fiscalização</div>
          <div className="text-[12px] text-muted-foreground mt-1">{props.documents.length} documentos</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* A lista de documentos fica no card acima em “Tudo salvo”. */}
        </div>
      </div>

      <div className="rounded-3xl border border-border/55 bg-card/55 p-4 space-y-3 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.10] bg-[linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-accent/60 via-border to-primary/60" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label>Categoria</Label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Título (opcional)</Label>
            <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Ex: Contrato social / Fotos gerais" />
          </div>

          <div className="space-y-1">
            <Label>Upload</Label>
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center justify-center gap-2 h-11 px-3 rounded-lg border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors flex-1 min-w-[180px]">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  multiple
                  disabled={uploading}
                  onChange={onFilesSelected}
                />
                <span className="text-sm font-semibold">{uploading ? "Enviando..." : "Selecionar arquivos"}</span>
              </label>

              <label className="flex items-center justify-center gap-2 h-11 px-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors min-w-[140px]">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  capture="environment"
                  multiple
                  disabled={uploading}
                  onChange={onFilesSelected}
                />
                <span className="text-sm font-semibold">Tirar foto</span>
              </label>
            </div>
          </div>
        </div>

        {showDocumentsList ? (
          <div className="relative space-y-1">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum documento encontrado para os filtros atuais.
              </div>
            ) : (
              <>
                <div className="max-h-[220px] overflow-y-auto pr-1">
                  <div className="divide-y divide-border/35">
                    {paginated.map((d) => {
                      const isImg = !!d.mimeType && d.mimeType.startsWith("image/");
                      const thumb =
                        isImg && d.thumbnailBase64
                          ? `data:${d.mimeType};base64,${d.thumbnailBase64}`
                          : null;

                      return (
                        <div key={d.id} className="py-3">
                          <div className="flex items-start gap-3 px-1">
                            <div className="shrink-0 w-14 h-14 rounded-xl border border-border/40 overflow-hidden bg-card/35 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {d.mimeType?.includes("pdf") ? "PDF" : "FILE"}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-extrabold text-sm truncate">{d.title}</div>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-card/70 border border-border/30 px-2 py-0.5 rounded-full">
                                  {d.category}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                                  {d.mimeType?.includes("pdf") ? "PDF" : isImg ? "Foto" : "Arquivo"}
                                </span>
                              </div>
                              <div className="text-[12px] text-muted-foreground truncate mt-1">{d.fileName}</div>
                              <div className="text-[12px] text-muted-foreground mt-1">
                                Enviado por {d.createdByUser?.name ?? "?"} • {formatDate(d.createdAt)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPreviewAttachment(d);
                                  setPreviewOpen(true);
                                }}
                              >
                                Abrir
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadAttachment(d)}
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Baixar
                              </Button>
                              {canDelete(d) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const ok = window.confirm(`Remover "${d.title}"? (ação auditada)`);
                                    if (ok) void props.onDelete(d.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <ListPagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  pageSize={DOCUMENTS_PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="documentos"
                />
              </>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-center pt-2">
            <div className="text-xs text-muted-foreground text-center max-w-[520px]">
              O que você envia aqui aparece no card acima.
            </div>
          </div>
        )}
      </div>

      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

