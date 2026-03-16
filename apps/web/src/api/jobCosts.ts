import { jobCostAttachments, jobCosts } from "./endpoints";

export async function fetchJobCosts(params: {
  jobSiteId: string;
  source?: string;
  payer?: string;
  category?: string;
}) {
  const search = new URLSearchParams();
  search.set("jobSiteId", params.jobSiteId);
  if (params.source) search.set("source", params.source);
  if (params.payer) search.set("payer", params.payer);
  if (params.category) search.set("category", params.category);

  const response = await fetch(`${jobCosts}?${search.toString()}`);
  if (!response.ok) throw new Error("Falha ao carregar custos da obra.");
  return response.json();
}

export async function fetchJobCostsSummary(jobSiteId: string) {
  const response = await fetch(`${jobCosts}/summary?jobSiteId=${encodeURIComponent(jobSiteId)}`);
  if (!response.ok) throw new Error("Falha ao carregar resumo da obra.");
  return response.json();
}

export async function createJobCost(payload: Record<string, unknown>) {
  const response = await fetch(jobCosts, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Falha ao criar lançamento.");
  return response.json();
}

export async function updateJobCost(id: string, payload: Record<string, unknown>) {
  const response = await fetch(`${jobCosts}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Falha ao atualizar lançamento.");
  return response.json();
}

export async function deleteJobCost(id: string) {
  const response = await fetch(`${jobCosts}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Falha ao remover lançamento.");
  return response.json();
}

export async function createJobCostAttachment(payload: Record<string, unknown>) {
  const response = await fetch(jobCostAttachments, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Falha ao salvar comprovante.");
  return response.json();
}

export async function deleteJobCostAttachment(id: string) {
  const response = await fetch(`${jobCostAttachments}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Falha ao remover comprovante.");
  return response.json();
}
