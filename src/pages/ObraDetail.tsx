import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Gavel, Hammer, TrendingUp, FileText, Plus, MapPin } from 'lucide-react';
import { MobileShell } from '@/components/layout/MobileShell';
import { EditableTitle } from '@/components/obra/EditableTitle';
import { StatusBadge } from '@/components/obra/StatusBadge';
import { MemberContributionCard } from '@/components/obra/MemberContributionCard';
import { ObraHeroPanel } from '@/components/obra/ObraHeroPanel';
import { ExpenseList } from '@/components/obra/ExpenseList';
import { LegalCostList } from '@/components/obra/LegalCostList';
import { LaborList } from '@/components/obra/LaborList';
import { ExpenseFormDrawer } from '@/components/obra/ExpenseFormDrawer';
import { LegalCostFormDrawer } from '@/components/obra/LegalCostFormDrawer';
import { LaborFormDrawer } from '@/components/obra/LaborFormDrawer';
import { SaleFormDrawer } from '@/components/obra/SaleFormDrawer';
import { MembersConfigDrawer } from '@/components/obra/MembersConfigDrawer';
import { AuditLogList, type AuditEntry } from '@/components/obra/AuditLogList';
import { calculateObraTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/obra/KpiCard';
import { SociosSettlementHero } from '@/components/obra/SociosSettlementHero';
import { SociosCardsGrid } from '@/components/obra/SociosCardsGrid';
import type { Expense, LegalCost, LaborEntry, Sale, ConstructionMember, JobSiteDocument } from '@/types';
import { JobSiteDocumentsBlock } from '@/components/obra/JobSiteDocumentsBlock';
import { fileToBase64 } from '@/lib/attachments';
import {
  listJobCosts,
  getJobCostsSummary,
  createJobCost,
  updateJobCost,
  deleteJobCost,
  createJobCostAttachment,
  deleteJobCostAttachment,
  listActivityFeed,
  listJobSiteMembers,
  setJobSiteMembers,
  listJobSiteDocuments,
  createJobSiteDocument,
  deleteJobSiteDocument,
  listUsers,
  type JobCostEntry,
  type JobCostPayer,
} from '@/lib/api';

import materialsCardImg from '../../feb36f06-5ba4-4c3e-a9b3-9b92e95ce7cd.png';
import tripleCardsImg from '../../ChatGPT Image 18 de mar. de 2026, 07_58_04.png';

type TabKey = 'resumo' | 'gastos' | 'legais' | 'mao-de-obra' | 'venda' | 'auditoria';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'resumo', label: 'Resumo', icon: TrendingUp },
  { key: 'gastos', label: 'Gastos', icon: Receipt },
  { key: 'legais', label: 'Legais', icon: Gavel },
  { key: 'mao-de-obra', label: 'Mão de obra', icon: Hammer },
  { key: 'venda', label: 'Venda', icon: TrendingUp },
  { key: 'auditoria', label: 'Auditoria', icon: FileText },
];

const ObraDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { constructions, updateConstruction, isLoading: isLoadingObras, error: obrasError, refresh: refreshObras } = useConstructions();
  const { user: authUser } = useAuth();
  const construction = constructions.find((c) => c.id === id);
  const isAdmin = authUser?.role === "ADMIN";
  const isPlatformSupport = authUser?.role === "PLATFORM_SUPPORT";

  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [jobCosts, setJobCosts] = useState<JobCostEntry[]>([]);
  const [summary, setSummary] = useState<{ obra: number; legal: number; labor: number; grand: number } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [legalDrawerOpen, setLegalDrawerOpen] = useState(false);
  const [editingLegalCost, setEditingLegalCost] = useState<LegalCost | null>(null);
  const [laborDrawerOpen, setLaborDrawerOpen] = useState(false);
  const [editingLaborEntry, setEditingLaborEntry] = useState<LaborEntry | null>(null);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [membersConfigOpen, setMembersConfigOpen] = useState(false);

  const [members, setMembers] = useState<ConstructionMember[]>([]);
  const [companyUsers, setCompanyUsers] = useState<Array<{ id: string; email: string; name: string; role: string }>>([]);
  const [documents, setDocuments] = useState<JobSiteDocument[]>([]);
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState<string>("");

  const payerFromUserId = useCallback((userId: string): JobCostPayer => {
    const index = members.findIndex((m) => m.userId === userId);
    if (index === 0) return 'BRUNO';
    if (index === 1) return 'ROBERTO';
    return 'OUTRO';
  }, [members]);

  const canEditByAuthor = useCallback((createdByUserId?: string | null) => {
    const role = authUser?.role;
    if (role === "PLATFORM_SUPPORT") return false;
    if (role === 'ADMIN') return true;
    if (!createdByUserId) return false;
    return authUser?.id === createdByUserId;
  }, [authUser?.id, authUser?.role]);

  const userIdFromPayer = useCallback((payer: JobCostPayer): string => {
    if (payer === 'BRUNO') return members[0]?.userId ?? 'u-default-1';
    if (payer === 'ROBERTO') return members[1]?.userId ?? 'u-default-2';
    return members[0]?.userId ?? 'u-default-1';
  }, [members]);

  const expenses = useMemo<Expense[]>(() => (
    jobCosts
      .filter((j) => j.source === 'OBRA')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        createdByUserId: (j as any).createdByUserId ?? null,
        updatedByUserId: (j as any).updatedByUserId ?? null,
        date: (j.date ?? '').slice(0, 10),
        costType: j.costType ?? 'Material',
        category: j.category,
        description: j.description,
        weekLabel: j.weekLabel ?? '',
        quantity: Number(j.quantity ?? 1),
        unitValue: Number(j.unitPrice ?? 0),
        totalValue: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
        receiptImageUrl: null,
        attachments: (j.attachments ?? []).map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileUrl: (a as any).fileUrl ?? undefined,
          fileDataBase64: a.fileDataBase64 ?? undefined,
          thumbnailBase64: (a as any).thumbnailBase64 ?? undefined,
          createdAt: (a as any).createdAt ?? undefined,
          createdByUser: (a as any).createdByUser
            ? {
                id: (a as any).createdByUser.id,
                name: (a as any).createdByUser.name,
                email: (a as any).createdByUser.email,
              }
            : null,
        })),
        supplier: j.supplier ?? undefined,
        invoiceNumber: j.invoiceNumber ?? undefined,
        paymentMethod: j.paymentMethod ?? undefined,
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const legalCosts = useMemo<LegalCost[]>(() => (
    jobCosts
      .filter((j) => j.source === 'LEGAL')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        createdByUserId: (j as any).createdByUserId ?? null,
        date: (j.date ?? '').slice(0, 10),
        type: j.category,
        description: j.description,
        value: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
        attachments: (j.attachments ?? []).map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileUrl: (a as any).fileUrl ?? undefined,
          fileDataBase64: a.fileDataBase64 ?? undefined,
          thumbnailBase64: (a as any).thumbnailBase64 ?? undefined,
          createdAt: (a as any).createdAt ?? undefined,
          createdByUser: (a as any).createdByUser
            ? {
                id: (a as any).createdByUser.id,
                name: (a as any).createdByUser.name,
                email: (a as any).createdByUser.email,
              }
            : null,
        })),
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const laborEntries = useMemo<LaborEntry[]>(() => (
    jobCosts
      .filter((j) => j.source === 'LABOR')
      .map((j) => ({
        id: j.id,
        constructionId: id!,
        createdByUserId: (j as any).createdByUserId ?? null,
        weekLabel: j.weekLabel ?? '',
        startDate: (j.date ?? '').slice(0, 10),
        endDate: (j.date ?? '').slice(0, 10),
        service: j.description,
        value: Number(j.totalAmount ?? 0),
        paidByUserId: userIdFromPayer(j.payer),
        notes: j.notes ?? '',
        attachments: (j.attachments ?? []).map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileUrl: (a as any).fileUrl ?? undefined,
          fileDataBase64: a.fileDataBase64 ?? undefined,
          thumbnailBase64: (a as any).thumbnailBase64 ?? undefined,
          createdAt: (a as any).createdAt ?? undefined,
          createdByUser: (a as any).createdByUser
            ? {
                id: (a as any).createdByUser.id,
                name: (a as any).createdByUser.name,
                email: (a as any).createdByUser.email,
              }
            : null,
        })),
      }))
  ), [jobCosts, id, userIdFromPayer]);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const [items, sum, membersRes, docsRes, usersRes] = await Promise.all([
        listJobCosts({ jobSiteId: id }),
        getJobCostsSummary(id),
        listJobSiteMembers(id),
        listJobSiteDocuments(id).catch(() => []),
        listUsers().catch(() => []),
      ]);
      setJobCosts(items);
      setSummary(sum.totals);

      const usersById = new Map((usersRes ?? []).map((u: any) => [u.id, u]));
      setCompanyUsers(usersRes ?? []);

      const mappedMembers: ConstructionMember[] = (membersRes ?? []).map((m: any) => ({
        id: m.id,
        constructionId: id,
        userId: m.userId,
        name: m.name ?? usersById.get(m.userId)?.name ?? 'Sócio',
        email: usersById.get(m.userId)?.email ?? '',
        sharePercent: Number(m.sharePercent ?? 0),
        sortIndex: Number(m.sortIndex ?? 0),
        createdAt: m.createdAt ?? undefined,
      }));
      setMembers(mappedMembers);
      setDocuments((docsRes ?? []) as JobSiteDocument[]);

      const latest = items.slice(0, 20);
      const feedLists = await Promise.all(
        latest.map((e) => listActivityFeed('JobCostEntry', e.id).catch(() => []))
      );
      const siteFeed = await listActivityFeed("JobSite", id).catch(() => []);
      const merged = [...feedLists.flat(), ...siteFeed];
      const byId = new Map<string, any>();
      for (const ev of merged) byId.set(ev.id, ev);
      const sorted = Array.from(byId.values()).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

      const mapped: AuditEntry[] = sorted.map((ev: any) => {
        const eventTypeStr = String(ev.eventType ?? "");
        const action: AuditEntry['action'] =
          eventTypeStr.includes('CREATED') ? 'create' :
          eventTypeStr.includes('UPDATED') ? 'update' :
          eventTypeStr.includes('DELETED') ? 'delete' : 'update';

        // Eventos vinculados à obra (participação e documentos gerais).
        if (String(ev.entityType) === "JobSite") {
          const payload = ev?.payload ?? {};
          const payloadAfter = payload?.after ?? payload;
          const payloadBefore = payload?.before ?? null;

          const entityType: AuditEntry['entityType'] = "obra";
          let label = `Atualização da obra (${ev.entityId})`;

          if (eventTypeStr.includes("PARTICIPATION_UPDATED")) {
            label = "Participação atualizada";
          } else if (eventTypeStr.includes("JOB_SITE_UPDATED")) {
            const after = payloadAfter ?? payload;
            const sale = after?.saleValue != null ? ` • Venda: R$ ${Number(after.saleValue).toLocaleString("pt-BR")}` : "";
            label = after?.status ? `Obra atualizada: ${String(after.status)}${sale}` : `Obra atualizada${sale}`;
          } else if (eventTypeStr.includes("JOB_SITE_DELETED")) {
            label = "Obra excluída";
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_CREATED")) {
            label = payloadAfter?.title ? `Documento enviado: ${payloadAfter.title}` : `Documento enviado: ${payloadAfter?.fileName ?? "Documento"}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_DELETED")) {
            const fileName = payloadBefore?.fileName ?? payloadAfter?.fileName ?? payload?.fileName ?? "Documento";
            label = `Documento removido: ${fileName}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_UPDATED")) {
            label = payloadAfter?.title ? `Documento atualizado: ${payloadAfter.title}` : `Documento atualizado: ${payloadAfter?.fileName ?? "Documento"}`;
          }

          return {
            id: ev.id,
            action,
            entityType,
            entityLabel: label,
            actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
            at: ev.createdAt,
          };
        }

        const payloadAfter = ev?.payload?.after ?? ev?.payload ?? {};
        const payloadBefore = ev?.payload?.before ?? null;
        const source = payloadAfter?.source;

        const entityType: AuditEntry['entityType'] =
          source === 'LEGAL' ? 'legal' :
          source === 'LABOR' ? 'mao-de-obra' :
          source === 'OBRA' ? 'gasto' :
          'gasto';

        let label = payloadAfter?.description ? String(payloadAfter.description) : `${entityType} ${ev.entityId}`;

        const isAttachmentEvent = eventTypeStr.includes('ATTACHMENT');
        const permission = ev?.payload?.permission as string | undefined;
        if (permission === "ADMIN_OVERRIDE") {
          label = `Admin: ${label}`;
        }

        if (eventTypeStr.includes("DENIED")) {
          const reason = payloadAfter?.reason ? String(payloadAfter.reason) : undefined;
          const targetCreatedByUserId = payloadAfter?.targetCreatedByUserId ? String(payloadAfter.targetCreatedByUserId) : undefined;
          const requestedPayer = payloadAfter?.requestedPayer ? String(payloadAfter.requestedPayer) : undefined;
          const suffixParts = [
            reason ? `motivo: ${reason}` : null,
            targetCreatedByUserId ? `targetAuthor: ${targetCreatedByUserId}` : null,
            requestedPayer ? `requestedPayer: ${requestedPayer}` : null,
          ].filter(Boolean);
          label = `Tentativa negada: ${eventTypeStr}${suffixParts.length ? ` (${suffixParts.join(" · ")})` : ""}`;

          return {
            id: ev.id,
            action,
            entityType,
            entityLabel: label,
            actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
            at: ev.createdAt,
          };
        }

        if (isAttachmentEvent) {
          const fileName = payloadAfter?.fileName ? String(payloadAfter.fileName) : 'Anexo';
          const jobLabel = payloadAfter?.description ? String(payloadAfter.description) : null;
          if (action === 'create') {
            label = jobLabel ? `Anexo: ${fileName} · ${jobLabel}` : `Anexo: ${fileName}`;
          } else if (action === 'delete') {
            const beforeFile = payloadBefore?.fileName ? String(payloadBefore.fileName) : fileName;
            label = jobLabel ? `Anexo removido: ${beforeFile} · ${jobLabel}` : `Anexo removido: ${beforeFile}`;
          } else if (action === 'update') {
            const beforeFile = payloadBefore?.fileName ? String(payloadBefore.fileName) : null;
            label = jobLabel
              ? `Anexo atualizado: ${beforeFile ? `${beforeFile} -> ` : ""}${fileName} · ${jobLabel}`
              : `Anexo atualizado: ${beforeFile ? `${beforeFile} -> ` : ""}${fileName}`;
          }
        } else if (action === 'update' && payloadBefore && payloadAfter) {
          const beforeAmount = payloadBefore?.totalAmount ?? payloadBefore?.value;
          const afterAmount = payloadAfter?.totalAmount ?? payloadAfter?.value;
          if (beforeAmount != null && afterAmount != null) {
            label = `${payloadAfter?.description ? String(payloadAfter.description) : label}: ${beforeAmount} -> ${afterAmount}`;
          }
        }
        return {
          id: ev.id,
          action,
          entityType,
          entityLabel: label,
          actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
          at: ev.createdAt,
        };
      });
      setAuditLog(mapped);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Falha ao carregar dados da API');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(
    () => calculateObraTotals(expenses, legalCosts, laborEntries, members, sale ?? undefined),
    [expenses, legalCosts, laborEntries, members, sale]
  );

  const addAudit = useCallback((action: AuditEntry['action'], entityType: AuditEntry['entityType'], entityLabel: string) => {
    setAuditLog((prev) => [
      { id: `audit-${Date.now()}`, action, entityType, entityLabel, at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  if (!construction) {
    return (
      <MobileShell showNav={false}>
        <div className="flex items-center justify-center min-h-screen text-muted-foreground px-4 text-center">
          {isLoadingObras ? (
            "Carregando obra..."
          ) : obrasError ? (
            <div>
              <p className="mb-3">{obrasError}</p>
              <Button type="button" variant="outline" size="sm" onClick={refreshObras}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            "Obra não encontrada"
          )}
        </div>
      </MobileShell>
    );
  }

  const handleAddExpense = async (data: any, expenseId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.date,
        source: 'OBRA' as const,
        category: data.category,
        costType: data.costType ?? 'Material',
        description: data.description,
        weekLabel: data.weekLabel || null,
        quantity: data.quantity ?? null,
        unitPrice: data.unitValue ?? null,
        totalAmount: data.totalValue,
        payer: payerFromUserId(data.paidByUserId),
        supplier: data.supplier || null,
        invoiceNumber: data.invoiceNumber || null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes || null,
      };

      const saved = expenseId ? await updateJobCost(expenseId, dto) : await createJobCost(dto);

      const prev = jobCosts.find((j) => j.id === saved.id);
      const prevAttIds = new Set((prev?.attachments ?? []).map((a) => a.id));
      const nextAtts = (data.attachments ?? []) as Array<{ id: string; fileName: string; mimeType: string; fileDataBase64?: string }>;

      for (const att of nextAtts) {
        if (prevAttIds.has(att.id)) continue;
        if (!att.fileDataBase64) continue;
        await createJobCostAttachment({
          jobCostEntryId: saved.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          storageType: "inline",
          fileDataBase64: att.fileDataBase64,
        });
      }

      const nextIds = new Set(nextAtts.map((a) => a.id));
      for (const prevAtt of prev?.attachments ?? []) {
        if (!nextIds.has(prevAtt.id)) {
          await deleteJobCostAttachment(prevAtt.id);
        }
      }

      await refresh();
      addAudit(expenseId ? 'update' : 'create', 'gasto', data.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar gasto');
    } finally {
      setEditingExpense(null);
      setExpenseDrawerOpen(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseDrawerOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;
    try {
      await deleteJobCost(expense.id);
      await refresh();
      addAudit('delete', 'gasto', expense.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir gasto');
    }
  };

  const handleAddLegalCost = async (data: any, costId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.date,
        source: 'LEGAL' as const,
        category: data.type,
        description: data.description,
        weekLabel: null,
        quantity: null,
        unitPrice: null,
        totalAmount: data.value,
        payer: payerFromUserId(data.paidByUserId),
        supplier: null,
        invoiceNumber: null,
        paymentMethod: null,
        notes: data.notes || null,
      };

      const saved = costId ? await updateJobCost(costId, dto) : await createJobCost(dto);

      const prev = jobCosts.find((j) => j.id === saved.id);
      const prevAttIds = new Set((prev?.attachments ?? []).map((a) => a.id));
      const nextAtts = (data.attachments ?? []) as Array<{ id: string; fileName: string; mimeType: string; fileDataBase64?: string }>;

      for (const att of nextAtts) {
        if (prevAttIds.has(att.id)) continue;
        if (!att.fileDataBase64) continue;
        await createJobCostAttachment({
          jobCostEntryId: saved.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          storageType: "inline",
          fileDataBase64: att.fileDataBase64,
        });
      }

      const nextIds = new Set(nextAtts.map((a) => a.id));
      for (const prevAtt of prev?.attachments ?? []) {
        if (!nextIds.has(prevAtt.id)) {
          await deleteJobCostAttachment(prevAtt.id);
        }
      }

      await refresh();
      addAudit(costId ? 'update' : 'create', 'legal', data.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar custo legal');
    } finally {
      setEditingLegalCost(null);
      setLegalDrawerOpen(false);
    }
  };

  const handleEditLegalCost = (cost: LegalCost) => {
    setEditingLegalCost(cost);
    setLegalDrawerOpen(true);
  };

  const handleDeleteLegalCost = async (cost: LegalCost) => {
    if (!window.confirm(`Excluir "${cost.description}"?`)) return;
    try {
      await deleteJobCost(cost.id);
      await refresh();
      addAudit('delete', 'legal', cost.description);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir custo legal');
    }
  };

  const handleAddLabor = async (data: any, entryId?: string) => {
    if (!id) return;
    try {
      const dto = {
        jobSiteId: id,
        date: data.startDate,
        source: 'LABOR' as const,
        category: 'Mão de obra',
        description: data.service,
        weekLabel: data.weekLabel || null,
        quantity: null,
        unitPrice: null,
        totalAmount: data.value,
        payer: payerFromUserId(data.paidByUserId),
        supplier: null,
        invoiceNumber: null,
        paymentMethod: null,
        notes: data.notes || null,
      };
      const saved = entryId ? await updateJobCost(entryId, dto) : await createJobCost(dto);

      const prev = jobCosts.find((j) => j.id === saved.id);
      const prevAttIds = new Set((prev?.attachments ?? []).map((a) => a.id));
      const nextAtts = (data.attachments ?? []) as Array<{ id: string; fileName: string; mimeType: string; fileDataBase64?: string }>;

      for (const att of nextAtts) {
        if (prevAttIds.has(att.id)) continue;
        if (!att.fileDataBase64) continue;
        await createJobCostAttachment({
          jobCostEntryId: saved.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          storageType: "inline",
          fileDataBase64: att.fileDataBase64,
        });
      }

      const nextIds = new Set(nextAtts.map((a) => a.id));
      for (const prevAtt of prev?.attachments ?? []) {
        if (!nextIds.has(prevAtt.id)) {
          await deleteJobCostAttachment(prevAtt.id);
        }
      }

      await refresh();
      addAudit(entryId ? 'update' : 'create', 'mao-de-obra', data.service);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao salvar mão de obra');
    } finally {
      setEditingLaborEntry(null);
      setLaborDrawerOpen(false);
    }
  };

  const handleEditLaborEntry = (entry: LaborEntry) => {
    setEditingLaborEntry(entry);
    setLaborDrawerOpen(true);
  };

  const handleDeleteLaborEntry = async (entry: LaborEntry) => {
    if (!window.confirm(`Excluir "${entry.service}"?`)) return;
    try {
      await deleteJobCost(entry.id);
      await refresh();
      addAudit('delete', 'mao-de-obra', entry.service);
    } catch (e: any) {
      alert(e?.message ?? 'Falha ao excluir mão de obra');
    }
  };

  const handleRegisterSale = (data: { saleValue: number; commissionPercent: number; commissionValue: number; taxValue: number; otherClosingCosts: number; notes?: string }) => {
    const newSale: Sale = {
      id: `s-${Date.now()}`,
      constructionId: id!,
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      soldAt: new Date().toISOString(),
      notes: data.notes ?? '',
    };
    setSale(newSale);
    updateConstruction(id!, { status: 'VENDIDA', saleValue: data.saleValue });
    addAudit('create', 'venda', `Venda R$ ${data.saleValue.toLocaleString('pt-BR')}`);
    setSaleDrawerOpen(false);
  };

  const handleUpdateSale = (data: { saleValue: number; commissionPercent: number; commissionValue: number; taxValue: number; otherClosingCosts: number; notes?: string }) => {
    if (!sale) return;
    setSale({
      ...sale,
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      notes: data.notes ?? '',
    });
    updateConstruction(id!, { saleValue: data.saleValue });
    addAudit('update', 'venda', `Venda atualizada R$ ${data.saleValue.toLocaleString('pt-BR')}`);
    setSaleDrawerOpen(false);
  };

  const openNewDrawer = () => {
    if (isPlatformSupport) {
      window.alert("Modo suporte: somente leitura.");
      return;
    }
    if (!members.length) {
      window.alert("Configuração de participação ainda não definida para esta obra. Peça ao admin para configurar.");
      return;
    }
    if (activeTab === 'gastos') {
      setEditingExpense(null);
      setExpenseDrawerOpen(true);
    } else if (activeTab === 'legais') {
      setEditingLegalCost(null);
      setLegalDrawerOpen(true);
    } else if (activeTab === 'mao-de-obra') {
      setEditingLaborEntry(null);
      setLaborDrawerOpen(true);
    }
  };

  const openExpenseDrawerQuick = () => {
    if (isPlatformSupport) {
      window.alert("Modo suporte: somente leitura.");
      return;
    }
    if (!members.length) {
      window.alert("Configuração de participação ainda não definida para esta obra. Peça ao admin para configurar.");
      return;
    }
    setEditingExpense(null);
    setExpenseDrawerOpen(true);
    setActiveTab('gastos');
  };

  return (
    <MobileShell showNav={false}>
      <div className="relative min-h-screen bg-background overflow-hidden">
        {/* Fundo estilo dashboard (match do print) */}
        {/* Sutil e sóbrio (evitar glow/neon exagerado) */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(0,0,0,0.14),transparent_55%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.10] bg-[radial-gradient(circle_at_22%_18%,rgba(249,115,22,0.14),transparent_62%),radial-gradient(circle_at_82%_28%,rgba(59,130,246,0.12),transparent_60%)]" />

        <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-30 border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <EditableTitle initialTitle={construction.title} onSave={(t) => console.log('save', t)} />
            </div>
            <StatusBadge status={construction.status} />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              {construction.address && (
                <>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{construction.address}</span>
                  <span className="opacity-50">•</span>
                </>
              )}
              <span className="truncate">
                Participação:{' '}
                {members.map((m) => `${m.name} ${m.sharePercent}%`).join(' · ')}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 shrink-0" />
          </div>
        </div>
        <div className="mx-4 mt-3 rounded-2xl border border-border/40 bg-card/10 px-2 py-2 flex overflow-x-auto gap-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-foreground text-background' : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-6 relative">
        {loadError && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {loadError}
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        {loading && (
          <div className="mb-4 text-sm text-muted-foreground">
            Carregando dados da API…
          </div>
        )}
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <ObraHeroPanel
              construction={construction}
              members={members}
              onConfigureMembers={() => setMembersConfigOpen(true)}
              onNovoLancamento={openExpenseDrawerQuick}
              kpis={{
                grandTotal: totals.grandTotal,
                totalMaterialCosts: totals.totalMaterialCosts,
                totalServiceCosts: totals.totalServiceCosts,
                totalLaborCosts: totals.totalLaborCosts,
              }}
              canConfigureMembers={authUser?.role === "ADMIN"}
            />

            {/* KPIs principais (hierarquia clara) */}
            <div className="grid grid-cols-12 gap-4 items-stretch">
              <div className="col-span-12 md:col-span-6">
                <KpiCard
                  label="Investimento total"
                  value={totals.grandTotal}
                  variant="accent"
                  emphasis="main"
                  subtitle="Todos os custos registrados"
                  icon={TrendingUp}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <KpiCard
                  label="Lucro após venda"
                  value={totals.liquidProfit}
                  variant="primary"
                  emphasis="main"
                  subtitle="Receita − investimento − custos legais"
                  icon={TrendingUp}
                />
              </div>
            </div>

            {/* Mesmo “bloco” do print: 4 cards (Materiais/Serviços/Legais/Mão de obra) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <KpiCard
                label="Materiais"
                value={totals.totalMaterialCosts}
                variant="accent"
                subtitle="Custo de insumos"
                icon={Receipt}
                backgroundImage={{ src: materialsCardImg, opacity: 0.14, position: '52% 22%', size: 'cover' }}
              />
              <KpiCard
                label="Serviços"
                value={totals.totalServiceCosts}
                variant="primary"
                subtitle="Execução e mobilização"
                icon={Hammer}
                backgroundImage={{ src: tripleCardsImg, opacity: 0.14, position: '8% 22%', size: '320%' }}
              />
              <KpiCard
                label="Legais"
                value={totals.totalLegalCosts}
                variant="neutral"
                subtitle="Custos de compliance"
                icon={Gavel}
                backgroundImage={{ src: tripleCardsImg, opacity: 0.14, position: '92% 22%', size: '320%' }}
              />
              <KpiCard
                label="Mão de obra"
                value={totals.totalLaborCosts}
                variant="primary"
                subtitle="Equipe e mão de obra"
                icon={Hammer}
                backgroundImage={{ src: tripleCardsImg, opacity: 0.14, position: '50% 22%', size: '320%' }}
              />
            </div>

            <SociosSettlementHero
              memberStats={totals.memberStats}
              onConfigureMembers={() => setMembersConfigOpen(true)}
              canConfigureMembers={authUser?.role === "ADMIN"}
            />

            <SociosCardsGrid memberStats={totals.memberStats} />

            {/* Auditoria resumida no Resumo (últimas atualizações) */}
            <div className="rounded-3xl border border-border/55 bg-card/60 shadow-card overflow-hidden">
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground">
                    ÚLTIMAS ATUALIZAÇÕES
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    Alterações recentes nesta obra (inclui tentativas negadas)
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('auditoria');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="shrink-0"
                >
                  Ver auditoria completa
                </Button>
              </div>
              <div className="border-t border-border/35 px-4 py-4">
                <AuditLogList entries={auditLog.slice(0, 6)} />
              </div>
            </div>

            <MembersConfigDrawer
              open={membersConfigOpen}
              onOpenChange={setMembersConfigOpen}
              constructionId={id!}
              initialMembers={members}
              users={companyUsers}
              onSave={async (nextMembers) => {
                await setJobSiteMembers(id!, nextMembers);
                await refresh();
              }}
            />

            <div className="mt-4">
              <JobSiteDocumentsBlock
                jobSiteId={id!}
                documents={documents}
                isAdmin={authUser?.role === "ADMIN"}
                currentUserId={authUser?.id}
                onUpload={async (files, docCategory, title) => {
                  // Upload serial para reduzir pressão na API; audit fica consistente por arquivo.
                  for (const f of files) {
                    const base64 = await fileToBase64(f);
                    const isImage = (f.type || "").startsWith("image/");
                    await createJobSiteDocument({
                      jobSiteId: id!,
                      category: docCategory || "OUTROS",
                      title: title || f.name,
                      fileName: f.name,
                      mimeType: f.type || "application/octet-stream",
                      storageType: "inline",
                      fileDataBase64: base64,
                      thumbnailBase64: isImage ? base64 : null,
                    });
                  }
                  await refresh();
                }}
                onDelete={async (documentId) => {
                  await deleteJobSiteDocument(documentId);
                  await refresh();
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'gastos' && (
          <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setFilterUser(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${!filterUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Todos
              </button>
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => setFilterUser(m.userId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${filterUser === m.userId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <ExpenseList
              members={members}
              expenses={expenses}
              filterByUser={filterUser}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              canEdit={(expense) => canEditByAuthor(expense.createdByUserId)}
            />
            <ExpenseFormDrawer members={members} open={expenseDrawerOpen} onOpenChange={setExpenseDrawerOpen} editingExpense={editingExpense} onSubmit={handleAddExpense} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'legais' && (
          <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
            <LegalCostList
              members={members}
              costs={legalCosts}
              onEdit={handleEditLegalCost}
              onDelete={handleDeleteLegalCost}
              canEdit={(cost) => canEditByAuthor(cost.createdByUserId)}
            />
            <LegalCostFormDrawer members={members} open={legalDrawerOpen} onOpenChange={setLegalDrawerOpen} editingCost={editingLegalCost} onSubmit={handleAddLegalCost} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'mao-de-obra' && (
          <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
            <LaborList
              members={members}
              entries={laborEntries}
              onEdit={handleEditLaborEntry}
              onDelete={handleDeleteLaborEntry}
              canEdit={(entry) => canEditByAuthor(entry.createdByUserId)}
            />
            <LaborFormDrawer members={members} open={laborDrawerOpen} onOpenChange={setLaborDrawerOpen} editingEntry={editingLaborEntry} onSubmit={handleAddLabor} />
            <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}

        {activeTab === 'venda' && (
          <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
            {sale ? (
              <>
                <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Dados da Venda</h3>
                    {isAdmin ? (
                      <Button variant="outline" size="sm" onClick={() => setSaleDrawerOpen(true)}>
                        Editar venda
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled title="Somente admin pode editar a venda">
                        Editar venda
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Valor de Venda</span>
                      <span className="font-mono font-bold text-lg text-primary">{formatCurrency(sale.saleValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Comissão</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.commissionValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Impostos</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.taxValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">Outros custos</span>
                      <span className="font-mono font-bold">{formatCurrency(sale.otherClosingCosts)}</span>
                    </div>
                  </div>
                  {sale.notes && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Obs: {sale.notes}</p>
                  )}
                </div>
                <div className="bg-foreground text-background rounded-2xl p-4 shadow-card">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Lucro Líquido</h3>
                  <span className="text-2xl font-mono font-bold text-primary">{formatCurrency(totals.liquidProfit)}</span>
                </div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Acerto Final</h3>
                {totals.memberStats.map((stat) => (
                  <MemberContributionCard key={stat.userId} stat={stat} />
                ))}
                <SaleFormDrawer
                  open={saleDrawerOpen}
                  onOpenChange={setSaleDrawerOpen}
                  initialData={sale}
                  onSubmit={handleUpdateSale}
                />
              </>
            ) : (
              <>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Obra ainda não vendida</p>
                  <p className="text-xs mt-1 mb-4">Registre a venda para ver lucro e acerto final</p>
                  {isAdmin ? (
                    <Button size="lg" onClick={() => setSaleDrawerOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Registrar venda
                    </Button>
                  ) : (
                    <Button size="lg" disabled className="gap-2" title="Somente admin pode registrar a venda">
                      <Plus className="w-4 h-4" />
                      Registrar venda
                    </Button>
                  )}
                </div>
                <SaleFormDrawer open={saleDrawerOpen} onOpenChange={setSaleDrawerOpen} onSubmit={handleRegisterSale} />
              </>
            )}
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
              Alterações nesta obra (criar, editar, excluir) + tentativas negadas
            </p>
            <div className="rounded-3xl border border-border/50 bg-card/40 p-4 shadow-sm">
              <AuditLogList entries={auditLog} />
            </div>
          </div>
        )}
      </div>
      </div>
    </MobileShell>
  );
};

export default ObraDetail;
