import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Paperclip } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { downloadAttachment } from '@/lib/attachments';
import { AttachmentPreviewDialog } from './AttachmentPreviewDialog';
import { ListPagination } from './ListPagination';
import type { JobSiteDocument } from '@/types';
import type { JobCostEntry } from '@/lib/api';
import { EXPENSE_CATEGORIES, LEGAL_TYPES } from '@/lib/job-cost-constants';
import JSZip from 'jszip';

/** Todas as categorias de comprovantes (gastos + legais + mão de obra) para criar pastas no ZIP. */
const ALL_COMPROVANTE_CATEGORIES = [...EXPENSE_CATEGORIES, ...LEGAL_TYPES, 'Mão de obra'] as const;
/** Categorias de documentos do dossiê para criar pastas no ZIP. */
const DOCUMENT_CATEGORIES = ['CONTRATO', 'PLANTA', 'FOTO', 'ALVARA', 'NF', 'RECIBO', 'OUTROS'] as const;

type Downloadable = { fileName: string; mimeType: string; fileDataBase64?: string | null; fileUrl?: string | null };

interface AllAttachmentsBlockProps {
  documents: JobSiteDocument[];
  jobCosts: JobCostEntry[];
}

type FlatItem = {
  id: string;
  type: 'document' | 'comprovante';
  /** Nome da categoria para subpasta no ZIP (ex.: Alvenaria, Cobertura) */
  category: string;
  origin: string;
  fileName: string;
  mimeType: string;
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
  createdAt?: string;
  createdBy?: string;
};

export function AllAttachmentsBlock({ documents, jobCosts }: AllAttachmentsBlockProps) {
  const [preview, setPreview] = useState<Downloadable | null>(null);
  const [page, setPage] = useState(1);
  const [activeType, setActiveType] = useState<'all' | 'document' | 'comprovante'>('all');
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Esse bloco fica na tela inicial lado a lado com outros cards.
  // Por isso, mostramos menos itens por página aqui para não consumir a tela.
  const ATTACHMENTS_PAGE_SIZE = 6;

  const items = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];
    for (const d of documents) {
      const cat = (d.category || 'Outros').trim() || 'Outros';
      list.push({
        id: `doc-${d.id}`,
        type: 'document',
        category: cat,
        origin: d.category || 'Documento',
        fileName: d.fileName,
        mimeType: d.mimeType,
        fileDataBase64: d.fileDataBase64 ?? undefined,
        fileUrl: d.fileUrl ?? undefined,
        thumbnailBase64: d.thumbnailBase64 ?? undefined,
        createdAt: d.createdAt,
        createdBy: d.createdByUser?.name,
      });
    }
    for (const entry of jobCosts) {
      const sourceLabel =
        entry.source === 'OBRA' ? 'Gasto' :
        entry.source === 'LEGAL' ? 'Custo legal' :
        entry.source === 'LABOR' ? 'Mão de obra' : 'Lançamento';
      const desc = (entry.description || '').slice(0, 40);
      const origin = `${sourceLabel}${desc ? `: ${desc}${desc.length >= 40 ? '…' : ''}` : ''}`;
      const cat = (entry.category || 'Outros').trim() || 'Outros';
      for (const a of entry.attachments ?? []) {
        list.push({
          id: `att-${a.id}`,
          type: 'comprovante',
          category: cat,
          origin,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileDataBase64: a.fileDataBase64 ?? undefined,
          fileUrl: (a as any).fileUrl ?? undefined,
          thumbnailBase64: (a as any).thumbnailBase64 ?? undefined,
          createdAt: (a as any).createdAt,
          createdBy: (a as any).createdByUser?.name,
        });
      }
    }
    return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [documents, jobCosts]);

  const filteredItems = useMemo<FlatItem[]>(() => {
    if (activeType === 'all') return items;
    return items.filter((i) => i.type === activeType);
  }, [items, activeType]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ATTACHMENTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filteredItems.slice(
        (safePage - 1) * ATTACHMENTS_PAGE_SIZE,
        safePage * ATTACHMENTS_PAGE_SIZE
      ),
    [filteredItems, safePage]
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [activeType]);

  // Quando novos itens chegam (upload/refresh), o usuário pode estar em uma página
  // que não mostra o que acabou de ser salvo. Reseta para a primeira página.
  useEffect(() => {
    setPage(1);
  }, [documents.length, jobCosts.length]);

  /** Nome de pasta seguro para ZIP (sem / \ : * ? " < > |) */
  const safeFolderName = (s: string) =>
    s.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'Outros';

  const downloadAllAsZip = async () => {
    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      const baseFolder = (t: FlatItem['type']) => (t === 'document' ? 'Documentos' : 'Comprovantes');
      const fileNameCounts = new Map<string, number>();

      const ensureUniqueName = (name: string, folderKey: string) => {
        const base = name || 'arquivo';
        const key = `${folderKey}/${base}`;
        const prev = fileNameCounts.get(key) ?? 0;
        fileNameCounts.set(key, prev + 1);
        if (prev === 0) return base;
        const dot = base.lastIndexOf('.');
        if (dot > 0 && dot < base.length - 1) {
          const n = base.slice(0, dot);
          const ext = base.slice(dot + 1);
          return `${n} (${prev + 1}).${ext}`;
        }
        return `${base} (${prev + 1})`;
      };

      const foldersWithFiles = new Set<string>();
      for (const item of filteredItems) {
        const base = baseFolder(item.type);
        const subFolder = safeFolderName(item.category);
        foldersWithFiles.add(`${base}/${subFolder}`);
      }

      const emptyPlaceholder = 'Nenhum arquivo nesta categoria.';
      for (const cat of ALL_COMPROVANTE_CATEGORIES) {
        const sub = safeFolderName(cat);
        const folderKey = `Comprovantes/${sub}`;
        if (!foldersWithFiles.has(folderKey)) zip.file(`${folderKey}/vazio.txt`, emptyPlaceholder);
      }
      for (const cat of DOCUMENT_CATEGORIES) {
        const sub = safeFolderName(cat);
        const folderKey = `Documentos/${sub}`;
        if (!foldersWithFiles.has(folderKey)) zip.file(`${folderKey}/vazio.txt`, emptyPlaceholder);
      }

      for (const item of filteredItems) {
        const base = baseFolder(item.type);
        const subFolder = safeFolderName(item.category);
        const folderKey = `${base}/${subFolder}`;
        const filePath = `${folderKey}/${ensureUniqueName(item.fileName, folderKey)}`;

        if (item.fileDataBase64) {
          zip.file(filePath, item.fileDataBase64, { base64: true });
        } else if (item.fileUrl) {
          const res = await fetch(item.fileUrl);
          const buf = await res.arrayBuffer();
          zip.file(filePath, buf);
        } else {
          // sem conteúdo para zip
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anexos_${activeType === 'all' ? 'tudo' : activeType}_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao baixar ZIP');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/55 bg-card/60 p-4 shadow-sm">
        <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">
          Comprovantes e anexos da obra
        </div>
        <p className="text-sm text-muted-foreground">Nenhum documento ou comprovante ainda. Tudo que for enviado fica salvo aqui.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/55 bg-card/60 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
            Comprovantes e anexos da obra
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tudo que foi enviado fica salvo. Use para comprovar gastos e mostrar notas fiscais quando precisar.
        </p>
        <p className="text-xs font-semibold text-primary mt-1">{items.length} arquivo(s)</p>
      </div>
      <div className="p-4 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeType === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveType('all')}
          >
            Tudo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeType === 'comprovante' ? 'default' : 'outline'}
            onClick={() => setActiveType('comprovante')}
          >
            Comprovantes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeType === 'document' ? 'default' : 'outline'}
            onClick={() => setActiveType('document')}
          >
            Documentos
          </Button>

          <div className="flex-1" />

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={downloadingAll}
            onClick={() => void downloadAllAsZip()}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {downloadingAll ? 'Montando ZIP...' : `Baixar todos (.zip)`}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="max-h-[360px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginated.map((item) => {
            const isImg = item.mimeType.startsWith("image/");
            const thumb =
              isImg && item.thumbnailBase64
                ? `data:${item.mimeType};base64,${item.thumbnailBase64}`
                : null;

            const att: Downloadable = {
              fileName: item.fileName,
              mimeType: item.mimeType,
              fileDataBase64: item.fileDataBase64 ?? null,
              fileUrl: item.fileUrl ?? null,
            };

            const typeLabel = item.type === "document" ? "Documento" : "Comprovante";

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/50 bg-background/40 p-3 hover:bg-card/40 transition-colors flex flex-col min-h-[150px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 w-12 h-12 rounded-xl border border-border/40 overflow-hidden bg-card/50 flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.fileName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.origin}</p>
                    </div>
                  </div>

                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-secondary/70 border border-border/40 text-muted-foreground px-2 py-0.5 rounded-full">
                    {typeLabel}
                  </span>
                </div>

                {item.createdAt && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDate(item.createdAt)}
                    {item.createdBy ? ` · ${item.createdBy}` : ""}
                  </p>
                )}

                <div className="mt-auto pt-3 flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => setPreview(att)}
                  >
                    Abrir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => downloadAttachment(att)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
      <ListPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filteredItems.length}
        pageSize={ATTACHMENTS_PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="arquivos"
      />
      <AttachmentPreviewDialog attachment={preview} open={!!preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}
