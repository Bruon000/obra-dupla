import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { fileToAttachmentPayload } from "./utils";

type FormValues = {
  date: string;
  source: "OBRA" | "LEGAL" | "LABOR";
  category: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  payer: "BRUNO" | "ROBERTO" | "CAIXA" | "OUTRO";
  supplierName: string;
  documentNumber: string;
  paymentMethod: string;
  notes: string;
  invoiceNumber: string;
  attachments: File[];
};

const sourceOptions = [
  { value: "OBRA", label: "Obra / Material" },
  { value: "LEGAL", label: "Legal / Taxas" },
  { value: "LABOR", label: "Mão de obra" },
];

const payerOptions = [
  { value: "BRUNO", label: "Bruno" },
  { value: "ROBERTO", label: "Roberto" },
  { value: "CAIXA", label: "Caixa" },
  { value: "OUTRO", label: "Outro" },
];

export function JobCostEntryFormDialog(props: {
  open: boolean;
  companyId: string;
  jobSiteId: string;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>, files: Array<Record<string, unknown>>) => Promise<void>;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState<FormValues>({
    date: today,
    source: "OBRA",
    category: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    total: "",
    payer: "BRUNO",
    supplierName: "",
    documentNumber: "",
    paymentMethod: "",
    notes: "",
    invoiceNumber: "",
    attachments: [],
  });
  const [saving, setSaving] = useState(false);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const quantity = Number(form.quantity || 0);
      const unitPrice = Number(form.unitPrice || 0);
      const computedTotal =
        Number(form.total || 0) > 0
          ? Number(form.total)
          : Number((quantity * unitPrice).toFixed(2));

      const attachments = await Promise.all(form.attachments.map(fileToAttachmentPayload));

      await props.onSubmit(
        {
          companyId: props.companyId,
          jobSiteId: props.jobSiteId,
          date: form.date,
          source: form.source,
          category: form.category,
          description: form.description,
          quantity: quantity || null,
          unitPrice: unitPrice || null,
          totalAmount: computedTotal,
          payer: form.payer,
          supplier: form.supplierName || null,
          invoiceNumber: form.documentNumber || null,
          paymentMethod: form.paymentMethod || null,
          notes: form.notes || null,
          weekLabel: null,
        },
        attachments,
      );
      props.onClose();
      setForm({
        date: today,
        source: "OBRA",
        category: "",
        description: "",
        quantity: "1",
        unitPrice: "",
        total: "",
        payer: "BRUNO",
        supplierName: "",
        documentNumber: "",
        paymentMethod: "",
        notes: "",
        invoiceNumber: "",
        attachments: [],
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>Novo gasto da obra</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Data"
            type="date"
            value={form.date}
            onChange={(e) => patch("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            select
            label="Origem"
            value={form.source}
            onChange={(e) => patch("source", e.target.value)}
            fullWidth
          >
            {sourceOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Categoria" value={form.category} onChange={(e) => patch("category", e.target.value)} fullWidth />
          <TextField label="Descrição" value={form.description} onChange={(e) => patch("description", e.target.value)} fullWidth />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Quantidade" value={form.quantity} onChange={(e) => patch("quantity", e.target.value)} fullWidth />
            <TextField label="Valor unitário" value={form.unitPrice} onChange={(e) => patch("unitPrice", e.target.value)} fullWidth />
            <TextField label="Total" value={form.total} onChange={(e) => patch("total", e.target.value)} fullWidth />
          </Stack>

          <TextField
            select
            label="Quem pagou"
            value={form.payer}
            onChange={(e) => patch("payer", e.target.value)}
            fullWidth
          >
            {payerOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Fornecedor" value={form.supplierName} onChange={(e) => patch("supplierName", e.target.value)} fullWidth />
          <TextField label="Número da nota/comprovante" value={form.documentNumber} onChange={(e) => patch("documentNumber", e.target.value)} fullWidth />
          <TextField label="Forma de pagamento" value={form.paymentMethod} onChange={(e) => patch("paymentMethod", e.target.value)} fullWidth />
          <TextField label="Observações" value={form.notes} onChange={(e) => patch("notes", e.target.value)} multiline minRows={3} fullWidth />

          <Box>
            <Button variant="outlined" component="label" fullWidth>
              Adicionar foto / PDF do comprovante
              <input
                hidden
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => patch("attachments", Array.from(e.target.files ?? []))}
              />
            </Button>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {form.attachments.map((file) => (
                <Box key={`${file.name}-${file.size}`}>{file.name}</Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
