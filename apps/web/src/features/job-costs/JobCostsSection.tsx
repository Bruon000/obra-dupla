import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useCreateJobCost,
  useCreateJobCostAttachment,
  useDeleteJobCost,
  useJobCosts,
  useJobCostsSummary,
} from "./useJobCosts";
import { JobCostEntryCard } from "./JobCostEntryCard";
import { JobCostEntryFormDialog } from "./JobCostEntryFormDialog";
import { JobCostsSummaryCards } from "./JobCostsSummaryCards";

export function JobCostsSection(props: {
  companyId: string;
  jobSiteId: string;
}) {
  const [open, setOpen] = useState(false);
  const costsQuery = useJobCosts(props.jobSiteId);
  const summaryQuery = useJobCostsSummary(props.jobSiteId);
  const createMutation = useCreateJobCost(props.jobSiteId);
  const createAttachmentMutation = useCreateJobCostAttachment(props.jobSiteId);
  const deleteMutation = useDeleteJobCost(props.jobSiteId);

  async function handleCreate(payload: Record<string, unknown>, files: Array<Record<string, unknown>>) {
    const created = await createMutation.mutateAsync(payload);
    for (const file of files) {
      await createAttachmentMutation.mutateAsync({
        companyId: props.companyId,
        jobCostEntryId: created.id,
        ...file,
      });
    }
  }

  return (
    <Box sx={{ pb: 2 }}>
      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="h6" fontWeight={700}>
              Custos da obra
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{
                minHeight: 48,
                borderRadius: 999,
                px: 2,
                fontWeight: 700,
              }}
            >
              Adicionar gasto
            </Button>
          </Stack>
        </Paper>

        <JobCostsSummaryCards summary={summaryQuery.data} />

        {costsQuery.isLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {costsQuery.isError ? (
          <Alert severity="error">Não foi possível carregar os custos da obra.</Alert>
        ) : null}

        <Stack spacing={1.5}>
          {(costsQuery.data ?? []).map((item: any) => (
            <JobCostEntryCard
              key={item.id}
              entry={item}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </Stack>

        <JobCostEntryFormDialog
          open={open}
          onClose={() => setOpen(false)}
          companyId={props.companyId}
          jobSiteId={props.jobSiteId}
          onSubmit={handleCreate}
        />
      </Stack>
    </Box>
  );
}
