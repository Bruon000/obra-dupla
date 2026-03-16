import {
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { JobCostEntryView } from "./types";
import { formatCurrency, formatDate } from "./utils";

function sourceLabel(source: JobCostEntryView["source"]) {
  if (source === "OBRA") return "Obra";
  if (source === "LEGAL") return "Legal";
  return "Mão de obra";
}

export function JobCostEntryCard(props: {
  item: JobCostEntryView;
  onDelete?: (id: string) => void;
}) {
  const hasReceipt = Boolean(props.item.attachments?.length);

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack spacing={0.5} minWidth={0}>
              <Typography variant="subtitle2" fontWeight={700}>
                {props.item.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(props.item.date)} • {props.item.category}
              </Typography>
            </Stack>
            {props.onDelete ? (
              <IconButton size="small" onClick={() => props.onDelete?.(props.item.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={sourceLabel(props.item.source)} />
            <Chip size="small" label={`Pagou: ${props.item.payer}`} variant="outlined" />
            <Chip
              size="small"
              color={hasReceipt ? "success" : "default"}
              icon={<ReceiptLongOutlinedIcon />}
              label={hasReceipt ? "Com comprovante" : "Sem comprovante"}
            />
          </Stack>

          <Stack spacing={0.5}>
            {props.item.supplierName ? (
              <Typography variant="body2">Fornecedor: {props.item.supplierName}</Typography>
            ) : null}
            {props.item.documentNumber ? (
              <Typography variant="body2">Documento: {props.item.documentNumber}</Typography>
            ) : null}
            {props.item.notes ? (
              <Typography variant="body2" color="text.secondary">
                {props.item.notes}
              </Typography>
            ) : null}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Qtd: {props.item.quantity ?? 1} • Unit.: {formatCurrency(props.item.unitPrice ?? props.item.total)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800}>
              {formatCurrency(props.item.total)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
