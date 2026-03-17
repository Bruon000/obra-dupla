import React from "react";
import { Card, CardContent, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { JobCostsSummary } from "./types";
import { formatCurrency } from "./utils";

function MetricCard(props: { title: string; value: number; subtitle?: string }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {props.title}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {formatCurrency(props.value)}
          </Typography>
          {props.subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {props.subtitle}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function JobCostsSummaryCards({ summary }: { summary?: JobCostsSummary }) {
  if (!summary) return null;

  const brunoDelta = summary.settlement?.bruno?.delta ?? 0;
  const robertoDelta = summary.settlement?.roberto?.delta ?? 0;
  const absAmount = Math.abs(brunoDelta);

  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Acerto entre sócios
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              Total geral: {formatCurrency(summary.totals?.grand ?? 0)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Bruno pagou ${formatCurrency(summary.settlement?.bruno?.paid ?? 0)}`} />
              <Chip label={`Roberto pagou ${formatCurrency(summary.settlement?.roberto?.paid ?? 0)}`} />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                color={brunoDelta > 0 ? "success" : brunoDelta < 0 ? "warning" : "default"}
                label={brunoDelta > 0 ? `Bruno recebe ${formatCurrency(brunoDelta)}` : brunoDelta < 0 ? `Bruno paga ${formatCurrency(absAmount)}` : "Bruno em dia"}
              />
              <Chip
                color={robertoDelta > 0 ? "success" : robertoDelta < 0 ? "warning" : "default"}
                label={robertoDelta > 0 ? `Roberto recebe ${formatCurrency(robertoDelta)}` : robertoDelta < 0 ? `Roberto paga ${formatCurrency(absAmount)}` : "Roberto em dia"}
              />
            </Stack>
            {absAmount > 0 && (
              <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                Acerto entre sócios: {robertoDelta < 0 ? "Roberto" : "Bruno"} paga {formatCurrency(absAmount)} para {brunoDelta > 0 ? "Bruno" : "Roberto"}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <MetricCard title="Total da obra" value={summary?.totals.grand ?? 0} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard title="Material/obra" value={summary?.totals.obra ?? 0} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard title="Mão de obra" value={summary?.totals.labor ?? 0} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard title="Legal/Taxas" value={summary?.totals.legal ?? 0} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard
          title="Bruno pagou"
          value={summary?.settlement.bruno.paid ?? 0}
          subtitle={(summary?.settlement?.bruno?.delta ?? 0) > 0 ? `Recebe ${formatCurrency(summary.settlement.bruno.delta)}` : (summary?.settlement?.bruno?.delta ?? 0) < 0 ? `Paga ${formatCurrency(Math.abs(summary.settlement.bruno.delta))}` : "Em dia"}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard
          title="Roberto pagou"
          value={summary?.settlement?.roberto?.paid ?? 0}
          subtitle={(summary?.settlement?.roberto?.delta ?? 0) > 0 ? `Recebe ${formatCurrency(summary.settlement.roberto.delta)}` : (summary?.settlement?.roberto?.delta ?? 0) < 0 ? `Paga ${formatCurrency(Math.abs(summary.settlement.roberto.delta))}` : "Em dia"}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard title="Meta por sócio" value={summary?.settlement.bruno.ideal ?? 0} />
      </Grid>
    </Grid>
  );
}
