/**
 * Base URL da API (NestJS). Para produção, defina VITE_API_URL no .env.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3005";

const STORAGE_TOKEN = "obra_dupla_token";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN);
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error("Não foi possível conectar à API. Verifique se a API está rodando em http://localhost:3005.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.message;
    const text = Array.isArray(msg) ? msg[0] : msg;
    throw new Error(text ?? `Erro na API (${res.status})`);
  }

  return res.json();
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new Error(
      "Não foi possível conectar à API. Verifique se a API está rodando (ex.: porta 3005) e se o endereço está correto."
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.message;
    const text = Array.isArray(msg) ? msg[0] : msg;
    throw new Error(text ?? "Falha ao entrar. Verifique e-mail e senha.");
  }
  return res.json();
}

export type JobCostSource = "OBRA" | "LEGAL" | "LABOR";
export type JobCostPayer = "BRUNO" | "ROBERTO" | "CAIXA" | "OUTRO";

export type JobCostAttachment = {
  id: string;
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  thumbnailBase64?: string | null;
  fileUrl?: string | null;
  createdAt?: string;
};

export type JobCostEntry = {
  id: string;
  jobSiteId: string;
  date: string; // ISO
  source: JobCostSource;
  category: string;
  description: string;
  weekLabel?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount: number;
  payer: JobCostPayer;
  supplier?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  attachments?: JobCostAttachment[];
};

export type ListJobCostsParams = {
  jobSiteId: string;
  source?: JobCostSource;
  payer?: JobCostPayer;
  category?: string;
  from?: string;
  to?: string;
};

export async function listJobCosts(params: ListJobCostsParams): Promise<JobCostEntry[]> {
  const qs = new URLSearchParams();
  qs.set("jobSiteId", params.jobSiteId);
  if (params.source) qs.set("source", params.source);
  if (params.payer) qs.set("payer", params.payer);
  if (params.category) qs.set("category", params.category);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  return apiFetch<JobCostEntry[]>(`/job-costs?${qs.toString()}`);
}

export type JobCostsSummaryResponse = {
  jobSiteId: string;
  totals: { obra: number; legal: number; labor: number; grand: number };
  bySource: Record<string, { total: number; count: number }>;
  byPayer: Record<string, { total: number; count: number }>;
  settlement: {
    bruno: { paid: number; ideal: number; delta: number };
    roberto: { paid: number; ideal: number; delta: number };
    partnersPaidTotal: number;
  };
  counts: { entries: number };
};

export async function getJobCostsSummary(jobSiteId: string): Promise<JobCostsSummaryResponse> {
  const qs = new URLSearchParams();
  qs.set("jobSiteId", jobSiteId);
  return apiFetch<JobCostsSummaryResponse>(`/job-costs/summary?${qs.toString()}`);
}

export type UpsertJobCostInput = {
  jobSiteId: string;
  date: string;
  source: JobCostSource;
  category: string;
  description: string;
  weekLabel?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount: number;
  payer: JobCostPayer;
  supplier?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
};

export async function createJobCost(dto: UpsertJobCostInput): Promise<JobCostEntry> {
  return apiFetch<JobCostEntry>("/job-costs", { method: "POST", body: JSON.stringify(dto) });
}

export async function updateJobCost(id: string, dto: UpsertJobCostInput): Promise<JobCostEntry> {
  return apiFetch<JobCostEntry>(`/job-costs/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function deleteJobCost(id: string): Promise<JobCostEntry> {
  return apiFetch<JobCostEntry>(`/job-costs/${id}`, { method: "DELETE" });
}

export type UpsertJobCostAttachmentInput = {
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  thumbnailBase64?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
};

export async function createJobCostAttachment(dto: UpsertJobCostAttachmentInput): Promise<JobCostAttachment> {
  return apiFetch<JobCostAttachment>("/job-cost-attachments", { method: "POST", body: JSON.stringify(dto) });
}

export async function updateJobCostAttachment(id: string, dto: UpsertJobCostAttachmentInput): Promise<JobCostAttachment> {
  return apiFetch<JobCostAttachment>(`/job-cost-attachments/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function deleteJobCostAttachment(id: string): Promise<JobCostAttachment> {
  return apiFetch<JobCostAttachment>(`/job-cost-attachments/${id}`, { method: "DELETE" });
}

export type ActivityFeedEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: any;
  createdAt: string;
  user?: { id: string; name: string; email: string };
};

export async function listActivityFeed(entityType: string, entityId: string): Promise<ActivityFeedEvent[]> {
  const qs = new URLSearchParams();
  qs.set("entityType", entityType);
  qs.set("entityId", entityId);
  return apiFetch<ActivityFeedEvent[]>(`/activity-feed?${qs.toString()}`);
}

export type JobSite = {
  id: string;
  title: string;
  address: string;
  notes: string;
  status: "EM_ANDAMENTO" | "VENDIDA" | "PAUSADA";
  startDate: string | null; // ISO
  endDate: string | null; // ISO
  saleValue: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CreateJobSiteInput = {
  title: string;
  address?: string;
  notes?: string;
  status?: "EM_ANDAMENTO" | "VENDIDA" | "PAUSADA";
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  saleValue?: number;
};

export async function listJobSites(): Promise<JobSite[]> {
  return apiFetch<JobSite[]>("/jobsites");
}

export async function createJobSite(dto: CreateJobSiteInput): Promise<JobSite> {
  return apiFetch<JobSite>("/jobsites", { method: "POST", body: JSON.stringify(dto) });
}

export async function getJobSite(id: string): Promise<JobSite> {
  return apiFetch<JobSite>(`/jobsites/${id}`);
}

export async function updateJobSite(id: string, dto: Partial<CreateJobSiteInput>): Promise<JobSite> {
  return apiFetch<JobSite>(`/jobsites/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

export async function deleteJobSite(id: string): Promise<JobSite> {
  return apiFetch<JobSite>(`/jobsites/${id}`, { method: "DELETE" });
}

export type CompanyUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  createdAt?: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role?: string;
};

export async function listUsers(): Promise<CompanyUser[]> {
  return apiFetch<CompanyUser[]>("/users");
}

export async function createUser(dto: CreateUserInput): Promise<CompanyUser> {
  return apiFetch<CompanyUser>("/users", { method: "POST", body: JSON.stringify(dto) });
}
