import React from "react";
import { Button, Card, CardContent, Chip, Stack, Typography, Divider } from "@mui/material";
import { formatCurrency, formatDate } from "./utils";
import { JobCostEntryView } from "./types";

type Props = {
  entry: JobCostEntryView;
  onDelete?: (id: string) => void;
};

export function JobCostEntryCard({ entry, onDelete }: Props) {
  const hasAttachments = !!entry.attachments?.length;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <CardContent>
        <Stack spacing={1.25}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" fontWeight={700}>
              {entry.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(entry.date)} • {entry.category}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 1.5, flexWrap: "wrap" }}>
            <Chip label={entry.source} size="small" />
            <Chip label={entry.category} size="small" variant="outlined" />
            <Chip label={`Pago por ${entry.payer}`} size="small" color="primary" variant="outlined" />
            <Chip
              label={hasAttachments ? "Com comprovante" : "Sem comprovante"}
              size="small"
              color={hasAttachments ? "success" : "default"}
              variant={hasAttachments ? "filled" : "outlined"}
            />
            <Chip
              size="small"
              label={entry.createdByUser?.name ? `Lançado por ${entry.createdByUser.name}` : "Autor não identificado"}
              variant="outlined"
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Data: {formatDate(entry.date)}
            </Typography>
            {!!entry.supplier && (
              <Typography variant="body2" color="text.secondary">
                Fornecedor: {entry.supplier}
              </Typography>
            )}
            {!!entry.invoiceNumber && (
              <Typography variant="body2" color="text.secondary">
                Documento: {entry.invoiceNumber}
              </Typography>
            )}
            {!!entry.notes && (
              <Typography variant="body2" color="text.secondary">
                Obs: {entry.notes}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Qtd: {entry.quantity ?? 1} • Unit.: {formatCurrency(entry.unitPrice ?? entry.totalAmount)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800}>
              {formatCurrency(entry.totalAmount)}
            </Typography>
          </Stack>

          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {entry.createdByUser?.name ? (
              <Typography variant="caption" color="text.secondary">
                Criado por: {entry.createdByUser.name}
              </Typography>
            ) : null}
            {entry.updatedByUser?.name ? (
              <Typography variant="caption" color="text.secondary">
                Última edição: {entry.updatedByUser.name}
              </Typography>
            ) : null}
            {entry.deletedAt && entry.deletedByUser?.name ? (
              <Typography variant="caption" color="error.main">
                Excluído por: {entry.deletedByUser.name}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button variant="text" size="small">
                Ver histórico
              </Button>
              {!entry.deletedAt && onDelete ? (
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const confirmed = window.confirm("Deseja realmente excluir este lançamento?");
                    if (confirmed) onDelete(entry.id);
                  }}
                >
                  Excluir
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
