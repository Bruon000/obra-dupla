import React from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { JobCostsSection } from "@/features/job-costs/JobCostsSection";

export default function JobSitePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { companyId?: string };
}) {
  const jobSiteId = params.id;
  const companyId = searchParams?.companyId ?? "";

  return (
    <Box sx={{ px: 2, py: 2, pb: 10 }}>
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Detalhe da obra
        </Typography>

        <Box>
          <JobCostsSection jobSiteId={jobSiteId} companyId={companyId} />
        </Box>

        <Divider />

        {/* restante da tela */}
      </Stack>
    </Box>
  );
}
