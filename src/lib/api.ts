/**
 * Base URL da API (NestJS).
 * - Dev (`npm run dev`): usa o mesmo host do navegador + porta 3005 (Wi‑Fi / testes).
 * - Produção / APK: defina VITE_API_URL no build (.env.production ou .env.android.lan).
 *   Sem isso, no APK o "localhost" seria o próprio celular — a API nunca conecta.
 */
const viteApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const isDev = import.meta.env.DEV;

function resolveApiBase(): string {
  if (isDev) {
    if (typeof window !== "undefined") {
      return `http://${window.location.hostname}:3005`;
    }
    return "http://localhost:3005";
  }
  if (viteApiUrl) {
    return viteApiUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    console.warn(
      "[Canteiro] VITE_API_URL não foi definida no build. Crie .env.production (URL pública da API) ou .env.android.lan (IP do PC na rede).",
    );
  }
  return "http://127.0.0.1:3005";
}

export const API_BASE = resolveApiBase();

const STORAGE_TOKEN = "obra_dupla_token";
const STORAGE_SUPPORT_COMPANY_ID = "obra_dupla_support_company_id";

// Alguns ambientes (ex.: WebView/Capacitor) podem ter instabilidade com leitura do localStorage.
// Mantemos o token também em memória para não quebrar autenticação entre renders.
let apiTokenInMemory: string | null = null;
export function setApiTokenInMemory(token: string | null) {
  apiTokenInMemory = token;
}

function getStoredToken(): string | null {
  try {
    if (apiTokenInMemory) return apiTokenInMemory;
    return localStorage.getItem(STORAGE_TOKEN);
  } catch {
    return apiTokenInMemory;
  }
}

function getStoredSupportCompanyId(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_SUPPORT_COMPANY_ID);
    return v ? String(v) : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // Evita página/interceptação do ngrok em chamadas de API no WebView.
  headers.set("ngrok-skip-browser-warning", "true");
  // Evita página de proteção/interceptação do localtunnel.
  headers.set("bypass-tunnel-reminder", "true");
  const supportCompanyId = getStoredSupportCompanyId();
  if (supportCompanyId) headers.set("X-Support-Company-Id", supportCompanyId);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_BASE}). Em desenvolvimento rode também a API (pnpm dev:api). Na Netlify defina VITE_API_URL e faça novo deploy.`,
    );
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

export type SupportCompany = {
  id: string;
  name: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "bypass-tunnel-reminder": "true",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new Error(
      `Não foi possível conectar à API (${API_BASE}). Verifique se a API está rodando e acessível na rede.`
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

export type RegisterPayload = {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
};

export async function registerAccount(payload: RegisterPayload): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "bypass-tunnel-reminder": "true",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_BASE}). Verifique se a API está rodando e acessível na rede.`,
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.message;
    const text = Array.isArray(msg) ? msg[0] : msg;
    throw new Error(text ?? `Erro no cadastro (${res.status})`);
  }
  return res.json();
}

export async function getBillingSummary(): Promise<{
  companyName: string;
  planSlug: string;
  billingStatus: string;
  trialEndsAt: string | null;
  limits: { maxJobSites: number; maxUsers: number; usedJobSites: number; usedUsers: number };
  stripeEnabled: boolean;
}> {
  return apiFetch("/billing/summary");
}

export async function listSupportCompanies(): Promise<SupportCompany[]> {
  return apiFetch<SupportCompany[]>("/support/companies");
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
  costType?: string | null;
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
  includeAttachments?: boolean;
};

export async function listJobCosts(params: ListJobCostsParams): Promise<JobCostEntry[]> {
  const qs = new URLSearchParams();
  qs.set("jobSiteId", params.jobSiteId);
  if (params.source) qs.set("source", params.source);
  if (params.payer) qs.set("payer", params.payer);
  if (params.category) qs.set("category", params.category);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.includeAttachments !== undefined) {
    qs.set("includeAttachments", params.includeAttachments ? "true" : "false");
  }
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
  costType?: string | null;
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
  commissionValue?: number;
  taxValue?: number;
  otherClosingCosts?: number;
  soldAt?: string | null;
  saleNotes?: string;
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
  commissionValue?: number;
  taxValue?: number;
  otherClosingCosts?: number;
  soldAt?: string | null;
  saleNotes?: string;
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
  try {
    return await apiFetch<CompanyUser[]>("/users");
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (msg.includes("403") || msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("acesso negado")) {
      return [];
    }
    throw e;
  }
}

export async function createUser(dto: CreateUserInput): Promise<CompanyUser> {
  return apiFetch<CompanyUser>("/users", { method: "POST", body: JSON.stringify(dto) });
}

export type UpdateUserInput = {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
};

export async function updateUser(userId: string, dto: UpdateUserInput): Promise<CompanyUser> {
  return apiFetch<CompanyUser>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(dto) });
}

// -----------------------------
// Participação / sócios da obra
// -----------------------------

export type JobSiteMemberInput = {
  userId: string;
  name?: string;
  sharePercent: number;
  sortIndex: number;
};

export async function listJobSiteMembers(jobSiteId: string): Promise<Array<{ id: string; jobSiteId: string; userId: string; name: string; sharePercent: number; sortIndex: number }>> {
  const qs = new URLSearchParams();
  qs.set("jobSiteId", jobSiteId);
  return apiFetch(`/job-site-members?${qs.toString()}`);
}

export async function setJobSiteMembers(jobSiteId: string, members: JobSiteMemberInput[]) {
  return apiFetch(`/job-site-members`, { method: "PATCH", body: JSON.stringify({ jobSiteId, members }) });
}

// -----------------------------
// Documentos da obra
// -----------------------------

export type JobSiteDocumentInput = {
  jobSiteId: string;
  category: string;
  title: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  thumbnailBase64?: string | null;
  fileUrl?: string | null;
};

export async function listJobSiteDocuments(jobSiteId: string, category?: string) {
  const qs = new URLSearchParams();
  qs.set("jobSiteId", jobSiteId);
  if (category) qs.set("category", category);
  return apiFetch(`/job-site-documents?${qs.toString()}`);
}

export async function createJobSiteDocument(dto: JobSiteDocumentInput) {
  return apiFetch(`/job-site-documents`, { method: "POST", body: JSON.stringify(dto) });
}

export async function deleteJobSiteDocument(id: string) {
  return apiFetch(`/job-site-documents/${id}`, { method: "DELETE" });
}

export async function updateJobSiteDocument(id: string, dto: Omit<JobSiteDocumentInput, "jobSiteId"> & { jobSiteId: string }) {
  return apiFetch(`/job-site-documents/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}
