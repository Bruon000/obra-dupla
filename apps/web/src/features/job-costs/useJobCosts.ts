import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createJobCost,
  createJobCostAttachment,
  deleteJobCost,
  fetchJobCosts,
  fetchJobCostsSummary,
  updateJobCost,
} from "../../api/jobCosts";

export function useJobCosts(jobSiteId: string) {
  return useQuery({
    queryKey: ["job-costs", jobSiteId],
    queryFn: () => fetchJobCosts({ jobSiteId }),
    enabled: Boolean(jobSiteId),
  });
}

export function useJobCostsSummary(jobSiteId: string) {
  return useQuery({
    queryKey: ["job-costs-summary", jobSiteId],
    queryFn: () => fetchJobCostsSummary(jobSiteId),
    enabled: Boolean(jobSiteId),
  });
}

export function useCreateJobCost(jobSiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => createJobCost(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-costs", jobSiteId] });
      qc.invalidateQueries({ queryKey: ["job-costs-summary", jobSiteId] });
    },
  });
}

export function useUpdateJobCost(jobSiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateJobCost(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-costs", jobSiteId] });
      qc.invalidateQueries({ queryKey: ["job-costs-summary", jobSiteId] });
    },
  });
}

export function useDeleteJobCost(jobSiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteJobCost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-costs", jobSiteId] });
      qc.invalidateQueries({ queryKey: ["job-costs-summary", jobSiteId] });
    },
  });
}

export function useCreateJobCostAttachment(jobSiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => createJobCostAttachment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-costs", jobSiteId] });
      qc.invalidateQueries({ queryKey: ["job-costs-summary", jobSiteId] });
    },
  });
}
