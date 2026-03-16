import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Fab,
  Stack,
  Typography,
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
    <Box sx={{ pb: 10 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>
          Custos da obra
        </Typography>

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
              item={item}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </Stack>
      </Stack>

      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ position: "fixed", right: 16, bottom: 16 }}
      >
        <AddIcon />
      </Fab>

      <JobCostEntryFormDialog
        open={open}
        onClose={() => setOpen(false)}
        companyId={props.companyId}
        jobSiteId={props.jobSiteId}
        onSubmit={handleCreate}
      />
    </Box>
  );
}
