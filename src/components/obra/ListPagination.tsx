import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE = 15;

export const LIST_PAGE_SIZE = DEFAULT_PAGE_SIZE;

type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Label opcional, ex: "gastos" */
  itemLabel?: string;
};

export function ListPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  itemLabel = "itens",
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50"
      aria-label="Paginação da lista"
    >
      <p className="text-xs text-muted-foreground">
        {totalItems} {itemLabel} · mostrando {from}–{to}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="px-2 text-sm text-muted-foreground min-w-[80px] text-center">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
