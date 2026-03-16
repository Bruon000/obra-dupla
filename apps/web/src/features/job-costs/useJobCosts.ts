import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActivityFeed } from "@/api/activityFeed";
import {
  createJobCost,
  createJobCostAttachment,
  deleteJobCost,
  fetchJobCosts,
  fetchJobCostsSummary,
  updateJobCost,
} from "../../api/jobCosts";

type JobCostFilters = {
  source?: string;
  payer?: string;
  category?: string;
};

export function useJobCostHistory(entryId: string, open: boolean) {
  return useQuery({
    queryKey: ["job-cost-history", entryId],
    queryFn: () =>
      fetchActivityFeed({
        entityType: "JobCostEntry",
        entityId: entryId,
      }),
    enabled: open && Boolean(entryId),
  });
}

export function useJobCosts(jobSiteId: string, filters?: JobCostFilters) {
  return useQuery({
    queryKey: ["job-costs", jobSiteId, filters?.source ?? "", filters?.payer ?? "", filters?.category ?? ""],
    queryFn: () =>
      fetchJobCosts({
        jobSiteId,
        source: filters?.source || undefined,
        payer: filters?.payer || undefined,
        category: filters?.category || undefined,
      }),
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
