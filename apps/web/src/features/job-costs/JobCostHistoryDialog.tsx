import React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useJobCostHistory } from "./useJobCostHistory";
import { formatDate } from "./utils";

type Props = {
  entryId: string;
  open: boolean;
  onClose: () => void;
};

function prettyPayload(payload: any) {
  if (!payload) return null;

  if (payload.before && payload.after) {
    return [
      `Antes: ${payload.before.description ?? "-"}`,
      `Depois: ${payload.after.description ?? "-"}`,
      `Valor antes: ${payload.before.totalAmount ?? 0}`,
      `Valor depois: ${payload.after.totalAmount ?? 0}`,
      `Pagador antes: ${payload.before.payer ?? "-"}`,
      `Pagador depois: ${payload.after.payer ?? "-"}`,
    ].join("\n");
  }

  if (payload.fileName) {
    return [
      `Arquivo: ${payload.fileName}`,
      `Tipo: ${payload.mimeType ?? "-"}`,
    ].join("\n");
  }

  if (payload.description || payload.totalAmount || payload.payer) {
    return JSON.stringify(payload, null, 2);
  }

  return JSON.stringify(payload, null, 2);
}

function prettyEvent(eventType: string) {
  switch (eventType) {
    case "JOB_COST_CREATED":
      return "Lançamento criado";
    case "JOB_COST_UPDATED":
      return "Lançamento atualizado";
    case "JOB_COST_DELETED":
      return "Lançamento excluído";
    case "JOB_COST_ATTACHMENT_CREATED":
      return "Comprovante adicionado";
    case "JOB_COST_ATTACHMENT_UPDATED":
      return "Comprovante atualizado";
    case "JOB_COST_ATTACHMENT_DELETED":
      return "Comprovante removido";
    default:
      return eventType;
  }
}

export function JobCostHistoryDialog({ entryId, open, onClose }: Props) {
  const query = useJobCostHistory(entryId, open);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Histórico do lançamento</DialogTitle>
      <DialogContent dividers>
        {query.isLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {query.isError ? (
          <Alert severity="error">Não foi possível carregar o histórico.</Alert>
        ) : null}

        {!query.isLoading && !query.isError ? (
          <Stack spacing={1.5}>
            {(query.data ?? []).length === 0 ? (
              <Alert severity="info">Nenhum evento encontrado para este lançamento.</Alert>
            ) : null}

            {(query.data ?? []).map((event: any) => (
              <Box key={event.id}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {prettyEvent(event.eventType)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {formatDate(event.createdAt)} •{" "}
                    {event.user?.name ?? event.user?.email ?? "Usuário não identificado"}
                  </Typography>

                  {event.payload ? (
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        overflowX: "auto",
                      }}
                    >
                      <Typography
                        component="pre"
                        sx={{
                          m: 0,
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {prettyPayload(event.payload)}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            ))}
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
