import React from "react";
import { Card, CardContent, Chip, Stack, Typography, Divider } from "@mui/material";
import { formatCurrency, formatDate } from "./utils";
import { JobCostEntryView } from "./types";

type Props = {
  entry: JobCostEntryView;
};

export function JobCostEntryCard({ entry }: Props) {
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
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Data: {formatDate(entry.date)}
            </Typography>
            {!!entry.supplierName && (
              <Typography variant="body2" color="text.secondary">
                Fornecedor: {entry.supplierName}
              </Typography>
            )}
            {!!entry.documentNumber && (
              <Typography variant="body2" color="text.secondary">
                Documento: {entry.documentNumber}
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
              Qtd: {entry.quantity ?? 1} • Unit.: {formatCurrency(entry.unitPrice ?? entry.total)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800}>
              {formatCurrency(entry.total)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
