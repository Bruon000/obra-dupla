import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
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
  return (
    <Grid container spacing={1.5}>
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
          subtitle={`Diferença: ${formatCurrency(summary?.settlement.bruno.delta ?? 0)}`}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard
          title="Roberto pagou"
          value={summary?.settlement.roberto.paid ?? 0}
          subtitle={`Diferença: ${formatCurrency(summary?.settlement.roberto.delta ?? 0)}`}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <MetricCard title="Meta por sócio" value={summary?.settlement.bruno.ideal ?? 0} />
      </Grid>
    </Grid>
  );
}
