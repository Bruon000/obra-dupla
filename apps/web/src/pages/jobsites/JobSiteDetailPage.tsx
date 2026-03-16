import React from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { JobCostsSection } from "@/features/job-costs/JobCostsSection";

type Props = {
  jobSiteId: string;
  companyId: string;
};

export function JobSiteDetailPage({ jobSiteId, companyId }: Props) {
  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Detalhe da Obra
      </Typography>

      <Stack spacing={3}>
        {/* bloco já existente: dados da obra */}
        <Box>
          <Typography variant="h6">Dados da obra</Typography>
        </Box>

        <Divider />

        <Box>
          <JobCostsSection jobSiteId={jobSiteId} companyId={companyId} />
        </Box>

        <Divider />

        {/* bloco já existente: orçamento / itens / histórico / etc */}
        <Box>
          <Typography variant="h6">Outras informações</Typography>
        </Box>
      </Stack>
    </Box>
  );
}
