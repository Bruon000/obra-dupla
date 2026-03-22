import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Gavel, Hammer, TrendingUp, FileText, Plus, MapPin, Bell, Pencil, FileDown } from 'lucide-react';
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
import { exportJobCostsToPdf } from '@/lib/exportJobCostsPdf';
import { calculateObraTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { useConstructions } from '@/contexts/ConstructionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/obra/KpiCard';
import { SociosSettlementHero } from '@/components/obra/SociosSettlementHero';
import { SociosCardsGrid } from '@/components/obra/SociosCardsGrid';
import type { Expense, LegalCost, LaborEntry, Sale, ConstructionMember, JobSiteDocument, Construction } from '@/types';
import { JobSiteDocumentsBlock } from '@/components/obra/JobSiteDocumentsBlock';
import { AllAttachmentsBlock } from '@/components/obra/AllAttachmentsBlock';
import { ObraEditDrawer } from '@/components/obra/ObraEditDrawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { fileToBase64 } from '@/lib/attachments';
import {
  listJobCosts,
  getJobCostsSummary,
  getJobSite,
  updateJobSite,
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

import kpiInvestimento from '@/assets/kpi/investimento.png';
import kpiLucro from '@/assets/kpi/lucro.png';
import kpiMateriais from '@/assets/kpi/materiais.png';
import kpiServicos from '@/assets/kpi/servicos.png';
import kpiLegais from '@/assets/kpi/legais.png';
import kpiMaoDeObra from '@/assets/kpi/mao-de-obra.png';

type TabKey = 'resumo' | 'gastos' | 'legais' | 'mao-de-obra' | 'venda' | 'auditoria';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'resumo', label: 'Resumo', icon: TrendingUp },
  { key: 'gastos', label: 'Gastos', icon: Receipt },
  { key: 'legais', label: 'Legais', icon: Gavel },
  { key: 'mao-de-obra', label: 'Mão de obra', icon: Hammer },
  { key: 'venda', label: 'Venda', icon: TrendingUp },
  { key: 'auditoria', label: 'Auditoria', icon: FileText },
];

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function mapJobSiteToConstruction(js: any): Construction {
  return {
    id: js.id,
    title: js.title ?? "",
    address: js.address ?? "",
    notes: js.notes ?? "",
    status: js.status ?? "EM_ANDAMENTO",
    startDate: toDateOnly(js.startDate) ?? new Date().toISOString().slice(0, 10),
    endDate: toDateOnly(js.endDate),
    saleValue: Number(js.saleValue ?? 0),
    commissionValue: Number(js.commissionValue ?? 0),
    taxValue: Number(js.taxValue ?? 0),
    otherClosingCosts: Number(js.otherClosingCosts ?? 0),
    soldAt: toDateOnly(js.soldAt),
    saleNotes: js.saleNotes ?? "",
    createdAt: toDateOnly(js.createdAt) ?? new Date().toISOString().slice(0, 10),
  };
}

const ObraDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateConstruction } = useConstructions();
  const { user: authUser } = useAuth();
  const [construction, setConstruction] = useState<Construction | null>(null);
  const [loadingConstruction, setLoadingConstruction] = useState(true);
  const [constructionError, setConstructionError] = useState<string>('');
  const isAdmin = authUser?.role === "ADMIN";
  const isPlatformSupport = authUser?.role === "PLATFORM_SUPPORT";

  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  /** ID do item destacado ao clicar na auditoria/notificação (para achar onde está a atualização) */
  const [auditHighlightId, setAuditHighlightId] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [jobCosts, setJobCosts] = useState<JobCostEntry[]>([]);
  const [summary, setSummary] = useState<{ obra: number; legal: number; labor: number; grand: number } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

  const notificationsRefreshingRef = useRef(false);
  const recentJobCostIds = useMemo(() => jobCosts.slice(0, 6).map((j) => j.id), [jobCosts]);
  const recentJobCostIdsKey = useMemo(() => recentJobCostIds.join('|'), [recentJobCostIds]);

  const [obraEditOpen, setObraEditOpen] = useState(false);
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastNotifSeenAt, setLastNotifSeenAt] = useState<string | null>(null);

  const NOTIF_LAST_SEEN_KEY = `obra_dupla_notif_seen_${id}`;

  /** Sincroniza estado da venda com a obra: quando a obra está VENDIDA no backend, a aba Venda deve mostrar os dados */
  useEffect(() => {
    if (!construction || construction.status !== 'VENDIDA' || !(construction.saleValue > 0)) return;
    setSale((prev) => {
      const nextCommission = Number(construction.commissionValue ?? 0);
      const nextTax = Number(construction.taxValue ?? 0);
      const nextOther = Number(construction.otherClosingCosts ?? 0);
      const nextSoldAt = construction.soldAt ?? null;
      const nextNotes = construction.saleNotes ?? '';

      if (
        prev &&
        prev.saleValue === construction.saleValue &&
        prev.commissionValue === nextCommission &&
        prev.taxValue === nextTax &&
        prev.otherClosingCosts === nextOther &&
        prev.soldAt === nextSoldAt &&
        (prev.notes ?? '') === nextNotes
      ) {
        return prev;
      }
      return {
        id: `${construction.id}-sale`,
        constructionId: construction.id,
        saleValue: construction.saleValue,
        commissionValue: nextCommission,
        taxValue: nextTax,
        otherClosingCosts: nextOther,
        soldAt: nextSoldAt,
        notes: nextNotes,
      };
    });
  }, [
    construction?.id,
    construction?.status,
    construction?.saleValue,
    construction?.commissionValue,
    construction?.taxValue,
    construction?.otherClosingCosts,
    construction?.soldAt,
    construction?.saleNotes,
  ]);

  const loadConstruction = useCallback(async () => {
    if (!id) return;
    setLoadingConstruction(true);
    setConstructionError('');
    try {
      const js = await getJobSite(id);
      setConstruction(mapJobSiteToConstruction(js));
    } catch (e: any) {
      setConstruction(null);
      setConstructionError(e?.message ?? 'Falha ao carregar obra');
    } finally {
      setLoadingConstruction(false);
    }
  }, [id]);

  // Atualiza periodicamente a obra para manter venda/valores sincronizados.
  useEffect(() => {
    void loadConstruction();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void loadConstruction();
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [loadConstruction]);

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

  // Alguns lançamentos antigos podem vir com `payer` como `CAIXA`/`OUTRO`.
  // Nesses casos, tentamos atribuir ao sócio que criou/atualizou o lançamento.
  const paidByUserIdFromPayer = useCallback(
    (payer: JobCostPayer, createdByUserId?: string | null, updatedByUserId?: string | null): string => {
      if (payer === 'BRUNO') return members[0]?.userId ?? 'u-default-1';
      if (payer === 'ROBERTO') return members[1]?.userId ?? 'u-default-2';

      const candidate = createdByUserId ?? updatedByUserId ?? null;
      if (candidate) {
        const idx = members.findIndex((m) => m.userId === candidate);
        if (idx >= 0) return members[idx]?.userId ?? members[0]?.userId ?? 'u-default-1';
      }

      return members[0]?.userId ?? 'u-default-1';
    },
    [members]
  );

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
        paidByUserId: paidByUserIdFromPayer(j.payer, (j as any).createdByUserId, (j as any).updatedByUserId),
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
        createdAt: (j as any).createdAt ?? undefined,
        updatedAt: (j as any).updatedAt ?? undefined,
      }))
      .sort((a, b) => new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime())
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
        paidByUserId: paidByUserIdFromPayer(j.payer, (j as any).createdByUserId, (j as any).updatedByUserId),
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
        createdAt: (j as any).createdAt ?? undefined,
        updatedAt: (j as any).updatedAt ?? undefined,
      }))
      .sort((a, b) => new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime())
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
        paidByUserId: paidByUserIdFromPayer(j.payer, (j as any).createdByUserId, (j as any).updatedByUserId),
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
        createdAt: (j as any).createdAt ?? undefined,
        updatedAt: (j as any).updatedAt ?? undefined,
      }))
      .sort((a, b) => new Date(b.createdAt ?? b.startDate).getTime() - new Date(a.createdAt ?? a.startDate).getTime())
  ), [jobCosts, id, userIdFromPayer]);

  /** Ao clicar em aviso de atualização (notificação ou auditoria): vai para a aba e destaca o item. Não abre o editor. */
  const handleAuditEntryClick = useCallback((entry: AuditEntry) => {
    const tabByEntityType: Record<AuditEntry['entityType'], TabKey> = {
      gasto: 'gastos',
      legal: 'legais',
      'mao-de-obra': 'mao-de-obra',
      venda: 'venda',
      obra: 'resumo',
    };
    const nextTab = tabByEntityType[entry.entityType];
    setActiveTab(nextTab);
    setFilterUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (entry.targetId) setAuditHighlightId(entry.targetId);
  }, []);

  const handleSaveObra = useCallback(
    async (data: Partial<Construction>) => {
      if (!id) return;
      try {
        const patch: Record<string, unknown> = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.address !== undefined) patch.address = data.address;
        if (data.notes !== undefined) patch.notes = data.notes;
        if (data.status !== undefined) patch.status = data.status;
        if (data.startDate !== undefined) patch.startDate = data.startDate || null;
        if (data.endDate !== undefined) patch.endDate = data.endDate || null;
        const updated = await updateJobSite(id, patch);
        setConstruction(mapJobSiteToConstruction(updated));
        setLoadError('');
        updateConstruction(id, data);
      } catch (e: any) {
        setLoadError(e?.message ?? 'Falha ao salvar obra');
      }
    },
    [id, updateConstruction]
  );

  const refresh = useCallback(async (mode: 'full' | 'documents' = 'full') => {
    if (!id) return;
    if (mode === 'documents') {
      setLoadError('');
      try {
        const [docsRes, siteFeed] = await Promise.all([
          listJobSiteDocuments(id).catch(() => []),
          listActivityFeed("JobSite", id).catch(() => []),
        ]);

        setDocuments(docsRes ?? []);

        const usersById = new Map<string, any>();
        const siteEvents = (siteFeed ?? []).map((ev: any) => {
          const eventTypeStr = String(ev.eventType ?? "");
          const action: AuditEntry['action'] =
            eventTypeStr.includes('CREATED') ? 'create' :
            eventTypeStr.includes('UPDATED') ? 'update' :
            eventTypeStr.includes('DELETED') ? 'delete' : 'update';

          const payload = ev?.payload ?? {};
          const payloadAfter = payload?.after ?? payload;
          const payloadBefore = payload?.before ?? null;

          const entityType: AuditEntry['entityType'] = "obra";
          let label = `Atualização da obra (${ev.entityId})`;

          if (eventTypeStr.includes("PARTICIPATION_UPDATED")) {
            const delta = payload?.delta;
            if (Array.isArray(delta) && delta.length) {
              const parts = delta
                .map((d: any) => {
                  const userId = d?.userId ? String(d.userId) : null;
                  const name = userId ? (usersById.get(userId)?.name ?? userId) : null;
                  const before = d?.before;
                  const after = d?.after;
                  if (!name) return null;
                  if (before == null && after != null) return `${name}: +${Number(after)}%`;
                  if (after == null && before != null) return `${name}: removido (${Number(before)}%)`;
                  if (before != null && after != null) return `${name}: ${Number(before)}% -> ${Number(after)}%`;
                  return null;
                })
                .filter(Boolean) as string[];
              label = parts.length ? `Participação alterada: ${parts.join(" · ")}` : "Participação atualizada";
            } else {
              label = "Participação atualizada";
            }
          } else if (eventTypeStr.includes("JOB_SITE_UPDATED")) {
            const after = payloadAfter ?? payload;
            const before = payloadBefore ?? null;

            const saleValue = after?.saleValue != null ? Number(after.saleValue) : null;
            const commissionValue = after?.commissionValue != null ? Number(after.commissionValue) : null;
            const taxValue = after?.taxValue != null ? Number(after.taxValue) : null;
            const otherClosingCosts = after?.otherClosingCosts != null ? Number(after.otherClosingCosts) : null;
            const soldAt = after?.soldAt ? String(after.soldAt).slice(0, 10) : null;

            const salePart = saleValue != null ? `Venda: R$ ${saleValue.toLocaleString("pt-BR")}` : null;
            const breakdownPart =
              commissionValue != null || taxValue != null || otherClosingCosts != null
                ? ` (comissão: R$ ${Number(commissionValue ?? 0).toLocaleString("pt-BR")}, impostos: R$ ${Number(taxValue ?? 0).toLocaleString("pt-BR")}, outros: R$ ${Number(otherClosingCosts ?? 0).toLocaleString("pt-BR")})`
                : "";
            const soldAtPart = soldAt ? ` • Vendida em ${soldAt}` : "";

            if (after?.status === "VENDIDA") {
              label = `${salePart ?? "Venda atualizada"}${breakdownPart}${soldAtPart}`;
            } else {
              const statusPart = after?.status ? `Status: ${String(after.status)}` : "";
              const beforeSaleValue = before?.saleValue != null ? Number(before.saleValue) : null;
              const saleChanged =
                saleValue != null && beforeSaleValue != null ? saleValue !== beforeSaleValue : saleValue != null;
              label = `${statusPart || "Obra atualizada"}${salePart && saleChanged ? ` • ${salePart}` : ""}`;
            }
          } else if (eventTypeStr.includes("JOB_SITE_DELETED")) {
            label = "Obra excluída";
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_CREATED")) {
            const title = payloadAfter?.title ? String(payloadAfter.title) : null;
            const category = payloadAfter?.category ? String(payloadAfter.category) : null;
            const fileName = payloadAfter?.fileName ? String(payloadAfter.fileName) : null;
            label = `Documento enviado: ${title ?? fileName ?? "Documento"}${category ? ` • ${category}` : ""}${fileName && fileName !== title ? ` • ${fileName}` : ""}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_DELETED")) {
            const fileName =
              payloadBefore?.fileName ?? payloadAfter?.fileName ?? payload?.fileName ?? "Documento";
            const category = payloadBefore?.category ?? payloadAfter?.category ?? null;
            label = `Documento removido: ${fileName}${category ? ` • ${String(category)}` : ""}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_UPDATED")) {
            const beforeTitle = payloadBefore?.title ? String(payloadBefore.title) : null;
            const beforeFileName = payloadBefore?.fileName ? String(payloadBefore.fileName) : null;
            const afterTitle = payloadAfter?.title ? String(payloadAfter.title) : null;
            const afterFileName = payloadAfter?.fileName ? String(payloadAfter.fileName) : null;
            const category = payloadAfter?.category ? String(payloadAfter.category) : null;
            const beforeLabel = beforeTitle ?? beforeFileName ?? "Documento";
            const afterLabel = afterTitle ?? afterFileName ?? "Documento";
            label = `Documento atualizado: ${beforeLabel} -> ${afterLabel}${category ? ` • ${category}` : ""}`;
          }

          return {
            id: ev.id,
            action,
            entityType,
            entityLabel: label,
            targetId: ev?.entityId ? String(ev.entityId) : undefined,
            actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
            actorId: ev?.user?.id ?? undefined,
            at: ev.createdAt,
          } satisfies AuditEntry;
        });

        setAuditLog((prev) => {
          const byId = new Map(prev.map((e) => [e.id, e]));
          for (const entry of siteEvents) byId.set(entry.id, entry);
          return Array.from(byId.values()).sort((a, b) =>
            String(b.at ?? "").localeCompare(String(a.at ?? ""))
          );
        });
      } catch (e: any) {
        setLoadError(e?.message ?? 'Falha ao carregar documentos');
      }
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      // Carregamos primeiro o que a maior parte da tela depende.
      // Docs e usuários podem demorar mais (base64/arquivos), então não queremos segurar a UI inteira.
      const [itemsRes, summaryRes, membersRes] = await Promise.allSettled([
        listJobCosts({ jobSiteId: id, includeAttachments: false }),
        getJobCostsSummary(id),
        listJobSiteMembers(id),
      ]);

      if (itemsRes.status === 'fulfilled') {
        setJobCosts(itemsRes.value);
      }
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.totals);
      }
      if (membersRes.status === 'fulfilled') {
        const mappedMembers: ConstructionMember[] = (membersRes.value ?? []).map((m: any) => ({
          id: m.id,
          constructionId: id,
          userId: m.userId,
          name: m.name ?? 'Sócio',
          email: '',
          sharePercent: Number(m.sharePercent ?? 0),
          sortIndex: Number(m.sortIndex ?? 0),
          createdAt: m.createdAt ?? undefined,
        }));
        setMembers(mappedMembers);
      }

      if (itemsRes.status === 'rejected' && summaryRes.status === 'rejected' && membersRes.status === 'rejected') {
        throw new Error('Falha ao carregar dados principais da obra');
      }

      if (itemsRes.status === 'rejected' || summaryRes.status === 'rejected' || membersRes.status === 'rejected') {
        setLoadError('Parte dos dados não carregou agora. Tentando atualizar em segundo plano...');
      }

      // UI não fica “travada” no F5.
      setLoading(false);

      // Busca attachments em background para não travar o carregamento inicial.
      // A UI (totais/listas) aparece rápido; os comprovantes/anexos carregam depois.
      void listJobCosts({ jobSiteId: id, includeAttachments: true })
        .then((withAttachments) => setJobCosts(withAttachments))
        .catch(() => {});

      const canLoadUsers = authUser?.role === "ADMIN" || authUser?.role === "PLATFORM_SUPPORT";
      const [docsRes, usersRes] = await Promise.all([
        listJobSiteDocuments(id).catch(() => []),
        canLoadUsers ? listUsers().catch(() => []) : Promise.resolve([]),
      ]);

      const usersById = new Map((usersRes ?? []).map((u: any) => [u.id, u]));
      setCompanyUsers(usersRes ?? []);
      setMembers((prev) =>
        prev.map((m) => {
          const u = usersById.get(m.userId);
          if (!u) return m;
          return { ...m, name: u.name ?? m.name, email: u.email ?? m.email };
        })
      );
      setDocuments((docsRes ?? []) as JobSiteDocument[]);

      // Para reduzir delay em ações (editar/cadastrar anexos), carregamos apenas
      // uma janela menor dos eventos mais recentes para a auditoria/notificações.
      const latest = (itemsRes.status === 'fulfilled' ? itemsRes.value : []).slice(0, 6);
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
            const delta = payload?.delta;
            if (Array.isArray(delta) && delta.length) {
              const parts = delta
                .map((d: any) => {
                  const userId = d?.userId ? String(d.userId) : null;
                  const name = userId ? (usersById.get(userId)?.name ?? userId) : null;
                  const before = d?.before;
                  const after = d?.after;
                  if (!name) return null;
                  if (before == null && after != null) return `${name}: +${Number(after)}%`;
                  if (after == null && before != null) return `${name}: removido (${Number(before)}%)`;
                  if (before != null && after != null) return `${name}: ${Number(before)}% -> ${Number(after)}%`;
                  return null;
                })
                .filter(Boolean);
              label = parts.length ? `Participação alterada: ${parts.join(" · ")}` : "Participação atualizada";
            } else {
              label = "Participação atualizada";
            }
          } else if (eventTypeStr.includes("JOB_SITE_UPDATED")) {
            const after = payloadAfter ?? payload;
            const before = payloadBefore ?? null;

            const saleValue = after?.saleValue != null ? Number(after.saleValue) : null;
            const commissionValue = after?.commissionValue != null ? Number(after.commissionValue) : null;
            const taxValue = after?.taxValue != null ? Number(after.taxValue) : null;
            const otherClosingCosts = after?.otherClosingCosts != null ? Number(after.otherClosingCosts) : null;
            const soldAt = after?.soldAt ? String(after.soldAt).slice(0, 10) : null;

            const salePart = saleValue != null ? `Venda: R$ ${saleValue.toLocaleString("pt-BR")}` : null;
            const breakdownPart =
              commissionValue != null || taxValue != null || otherClosingCosts != null
                ? ` (comissão: R$ ${Number(commissionValue ?? 0).toLocaleString("pt-BR")}, impostos: R$ ${Number(taxValue ?? 0).toLocaleString("pt-BR")}, outros: R$ ${Number(otherClosingCosts ?? 0).toLocaleString("pt-BR")})`
                : "";
            const soldAtPart = soldAt ? ` • Vendida em ${soldAt}` : "";

            if (after?.status === "VENDIDA") {
              label = `${salePart ?? "Venda atualizada"}${breakdownPart}${soldAtPart}`;
            } else {
              const statusPart = after?.status ? `Status: ${String(after.status)}` : "";
              const beforeSaleValue = before?.saleValue != null ? Number(before.saleValue) : null;
              const saleChanged = saleValue != null && beforeSaleValue != null ? saleValue !== beforeSaleValue : saleValue != null;
              label = `${statusPart || "Obra atualizada"}${salePart && saleChanged ? ` • ${salePart}` : ""}`;
            }
          } else if (eventTypeStr.includes("JOB_SITE_DELETED")) {
            label = "Obra excluída";
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_CREATED")) {
            const title = payloadAfter?.title ? String(payloadAfter.title) : null;
            const category = payloadAfter?.category ? String(payloadAfter.category) : null;
            const fileName = payloadAfter?.fileName ? String(payloadAfter.fileName) : null;
            label = `Documento enviado: ${title ?? fileName ?? "Documento"}${category ? ` • ${category}` : ""}${fileName && fileName !== title ? ` • ${fileName}` : ""}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_DELETED")) {
            const fileName = payloadBefore?.fileName ?? payloadAfter?.fileName ?? payload?.fileName ?? "Documento";
            const category = payloadBefore?.category ?? payloadAfter?.category ?? null;
            label = `Documento removido: ${fileName}${category ? ` • ${String(category)}` : ""}`;
          } else if (eventTypeStr.includes("JOB_SITE_DOCUMENT_UPDATED")) {
            const beforeTitle = payloadBefore?.title ? String(payloadBefore.title) : null;
            const beforeFileName = payloadBefore?.fileName ? String(payloadBefore.fileName) : null;
            const afterTitle = payloadAfter?.title ? String(payloadAfter.title) : null;
            const afterFileName = payloadAfter?.fileName ? String(payloadAfter.fileName) : null;
            const category = payloadAfter?.category ? String(payloadAfter.category) : null;
            const beforeLabel = beforeTitle ?? beforeFileName ?? "Documento";
            const afterLabel = afterTitle ?? afterFileName ?? "Documento";
            label = `Documento atualizado: ${beforeLabel} -> ${afterLabel}${category ? ` • ${category}` : ""}`;
          }

          return {
            id: ev.id,
            action,
            entityType,
            entityLabel: label,
            targetId: ev?.entityId ? String(ev.entityId) : undefined,
            actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
            actorId: ev?.user?.id ?? undefined,
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
            targetId: ev?.entityId ? String(ev.entityId) : undefined,
            actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
            actorId: ev?.user?.id ?? undefined,
            at: ev.createdAt,
          };
        }

        if (isAttachmentEvent) {
          const jobLabel = payloadAfter?.description ? String(payloadAfter.description) : null;
          const payer = payloadAfter?.payer ? String(payloadAfter.payer) : null;
          const sourceLabel = payloadAfter?.source ? String(payloadAfter.source) : null;
          const metaParts = [payer ? `pago por ${payer}` : null, sourceLabel ? `fonte ${sourceLabel}` : null].filter(Boolean);
          const meta = metaParts.length ? ` • ${metaParts.join(" • ")}` : "";
          const getAmount = (p: any) => p?.totalAmount ?? p?.value ?? null;
          const amount = getAmount(payloadAfter);
          const valuePart = amount != null ? ` • ${formatCurrency(Number(amount))}` : "";
          label = `${jobLabel ?? "Lançamento"}${meta}${valuePart}`;
        } else {
          const getAmount = (p: any) => p?.totalAmount ?? p?.value ?? null;
          const descAfter = payloadAfter?.description ? String(payloadAfter.description) : null;
          const descBefore = payloadBefore?.description ? String(payloadBefore.description) : null;
          const desc = descAfter ?? descBefore ?? label;

          const categoryAfter = payloadAfter?.category ? String(payloadAfter.category) : null;
          const categoryBefore = payloadBefore?.category ? String(payloadBefore.category) : null;
          const payerAfter = payloadAfter?.payer ? String(payloadAfter.payer) : null;
          const payerBefore = payloadBefore?.payer ? String(payloadBefore.payer) : null;
          const sourceAfter = payloadAfter?.source ? String(payloadAfter.source) : null;
          const sourceBefore = payloadBefore?.source ? String(payloadBefore.source) : null;

          const amountAfter = getAmount(payloadAfter);
          const amountBefore = payloadBefore ? getAmount(payloadBefore) : null;

          const amountBeforeValue = amountBefore;
          const parts: string[] = [];

          const categoryPart =
            categoryAfter && categoryBefore && categoryAfter !== categoryBefore
              ? `${categoryBefore} -> ${categoryAfter}`
              : (categoryAfter ?? categoryBefore);
          if (categoryPart) parts.push(`cat. ${categoryPart}`);

          if (payerAfter) {
            if (payerBefore && payerAfter !== payerBefore) parts.push(`pago por ${payerBefore} -> ${payerAfter}`);
            else parts.push(`pago por ${payerAfter}`);
          }

          const sourcePart = sourceAfter ?? sourceBefore;
          if (sourcePart) parts.push(`fonte ${sourcePart}`);

          if (action === 'create') {
            if (amountAfter != null) parts.push(`R$ ${Number(amountAfter).toLocaleString("pt-BR")}`);
            label = `${desc}${parts.length ? ` • ${parts.join(" • ")}` : ""}`;
          } else if (action === 'update') {
            if (amountBeforeValue != null && amountAfter != null) parts.push(`R$ ${Number(amountBeforeValue).toLocaleString("pt-BR")} -> ${Number(amountAfter).toLocaleString("pt-BR")}`);
            label = `${desc}${parts.length ? ` • ${parts.join(" • ")}` : ""}`;
          } else if (action === 'delete') {
            if (amountAfter != null) parts.push(`R$ ${Number(amountAfter).toLocaleString("pt-BR")}`);
            label = `${desc}${parts.length ? ` • ${parts.join(" • ")}` : ""}`;
          }
        }

        if (permission === "ADMIN_OVERRIDE") {
          label = `Admin: ${label}`;
        }
        return {
          id: ev.id,
          action,
          entityType,
          entityLabel: label,
          targetId: ev?.entityId ? String(ev.entityId) : undefined,
          actorName: ev?.user?.name ?? ev?.user?.email ?? undefined,
          actorId: ev?.user?.id ?? undefined,
          at: ev.createdAt,
          isAttachmentEvent: isAttachmentEvent || undefined,
        };
      });
      setAuditLog(mapped);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Falha ao carregar dados da API');
    } finally {
      setLoading(false);
    }
  }, [id, authUser?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(
    () => calculateObraTotals(expenses, legalCosts, laborEntries, members, sale ?? undefined),
    [expenses, legalCosts, laborEntries, members, sale]
  );

  /** Notificações: ações do outro(s) sócio(s) nesta obra */
  const notifications = useMemo(() => {
    if (!authUser?.id) return [];
    return auditLog.filter((e) => e.actorId && e.actorId !== authUser.id);
  }, [auditLog, authUser?.id]);

  const NOTIF_PREVIEW_COUNT = 8;
  const effectiveLastSeenAt = useMemo(() => {
    if (lastNotifSeenAt) return lastNotifSeenAt;
    if (typeof id !== 'string') return null;
    try {
      return localStorage.getItem(NOTIF_LAST_SEEN_KEY);
    } catch {
      return null;
    }
  }, [lastNotifSeenAt, id, NOTIF_LAST_SEEN_KEY]);

  /** Só aparecem no painel as que ainda não foram vistas; ao fechar o painel (marcar como vistas), saem da lista. */
  const unreadNotifications = useMemo(() => {
    if (notifications.length === 0) return [];
    if (!effectiveLastSeenAt) return notifications;
    const t = new Date(effectiveLastSeenAt).getTime();
    return notifications.filter((n) => new Date(n.at).getTime() > t);
  }, [notifications, effectiveLastSeenAt]);

  const unreadCount = unreadNotifications.length;
  const unreadNotificationsPreview = useMemo(
    () => unreadNotifications.slice(0, NOTIF_PREVIEW_COUNT),
    [unreadNotifications]
  );

  const markNotificationsSeen = useCallback(() => {
    const now = new Date().toISOString();
    setLastNotifSeenAt(now);
    if (id) try { localStorage.setItem(NOTIF_LAST_SEEN_KEY, now); } catch {}
  }, [id, NOTIF_LAST_SEEN_KEY]);

  /** Gastos por sócio por tipo (para a faixa no topo de todas as abas) */
  const gastosPorSocio = useMemo(() => {
    return members.map((m) => {
      const gastos = expenses.filter((e) => e.paidByUserId === m.userId).reduce((a, e) => a + e.totalValue, 0);
      const legais = legalCosts.filter((l) => l.paidByUserId === m.userId).reduce((a, l) => a + l.value, 0);
      const maoDeObra = laborEntries.filter((l) => l.paidByUserId === m.userId).reduce((a, l) => a + l.value, 0);
      return { name: m.name, userId: m.userId, gastos, legais, maoDeObra, total: gastos + legais + maoDeObra };
    });
  }, [members, expenses, legalCosts, laborEntries]);

  const addAudit = useCallback((action: AuditEntry['action'], entityType: AuditEntry['entityType'], entityLabel: string) => {
    // Não adiciona audit localmente.
    // Depois de cada ação relevante a tela chama `refresh()`, que recarrega a auditoria via ActivityFeed do backend.
    // Somar audit localmente junto com o reload cria duplicidade e deixa a auditoria "bagunçada".
  }, []);

  // Notificações: atualizar rápido sem recarregar tudo.
  // Busca somente os últimos eventos da activity-feed e recalcula o auditLog (usado pelo sheet do sino).
  const refreshNotifications = useCallback(async () => {
    if (!id) return;
    if (notificationsRefreshingRef.current) return;
    const ids = recentJobCostIdsKey.split('|').filter(Boolean);
    if (ids.length === 0) return;

    notificationsRefreshingRef.current = true;
    try {
      const canLoadUsers = authUser?.role === "ADMIN" || authUser?.role === "PLATFORM_SUPPORT";
      const [usersRes, ...feedLists] = await Promise.all([
        canLoadUsers ? listUsers().catch(() => []) : Promise.resolve([]),
        ...ids.map((entryId) => listActivityFeed('JobCostEntry', entryId).catch(() => [])),
      ]);

      const siteFeed = await listActivityFeed('JobSite', id).catch(() => []);

      const merged = [
        ...(feedLists.flat() as any[]),
        ...(siteFeed as any[]),
      ];

      // Remove duplicados por id e ordena por data.
      const byId = new Map<string, any>();
      for (const ev of merged) byId.set(ev.id, ev);
      const sorted = Array.from(byId.values()).sort((a, b) =>
        String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
      );

      const mapped: AuditEntry[] = sorted.map((ev: any) => {
        const eventTypeStr = String(ev.eventType ?? '');
        const action: AuditEntry['action'] =
          eventTypeStr.includes('CREATED') ? 'create' :
          eventTypeStr.includes('UPDATED') ? 'update' :
          eventTypeStr.includes('DELETED') ? 'delete' : 'update';

        const actorName = ev?.user?.name ?? ev?.user?.email ?? undefined;
        const actorId = ev?.user?.id ?? undefined;

        // Eventos vindos diretamente da obra.
        if (String(ev.entityType) === 'JobSite') {
          const payload = ev?.payload ?? {};
          const after = payload?.after ?? payload;
          const before = payload?.before ?? null;

          const status = after?.status ?? before?.status;
          const saleValue = after?.saleValue != null ? Number(after.saleValue) : null;

          let entityLabel = 'Atualização da obra';

          if (eventTypeStr.includes('PARTICIPATION_UPDATED')) {
            entityLabel = 'Participação atualizada';
          } else if (eventTypeStr.includes('JOB_SITE_DOCUMENT_CREATED')) {
            const title = after?.title ? String(after.title) : null;
            const fileName = after?.fileName ? String(after.fileName) : null;
            entityLabel = `Documento enviado: ${title ?? fileName ?? 'Documento'}`;
          } else if (eventTypeStr.includes('JOB_SITE_DOCUMENT_UPDATED')) {
            entityLabel = 'Documento atualizado';
          } else if (eventTypeStr.includes('JOB_SITE_DOCUMENT_DELETED')) {
            entityLabel = 'Documento removido';
          } else if (eventTypeStr.includes('JOB_SITE_UPDATED')) {
            if (status === 'VENDIDA') {
              entityLabel = `Venda registrada${saleValue != null ? ` • ${formatCurrency(saleValue)}` : ''}`;
            } else {
              entityLabel = 'Obra atualizada';
            }
          }

          return {
            id: ev.id,
            action,
            entityType: 'obra',
            entityLabel,
            actorName,
            actorId,
            at: ev.createdAt,
          };
        }

        // Eventos de custo/lançamento.
        const payload = ev?.payload ?? {};
        const after = payload?.after ?? payload;
        const before = payload?.before ?? null;
        const source = after?.source as string | undefined;

        const entityType: AuditEntry['entityType'] =
          source === 'LEGAL' ? 'legal' :
          source === 'LABOR' ? 'mao-de-obra' :
          'gasto';

        const desc = after?.description ? String(after.description) : 'Lançamento';
        const category = after?.category ? String(after.category) : null;
        const payer = after?.payer ? String(after.payer) : null;

        const payerName =
          payer === 'BRUNO' ? members[0]?.name :
          payer === 'ROBERTO' ? members[1]?.name :
          payer ?? undefined;

        const amountAfter = after?.totalAmount ?? after?.value ?? null;
        const amountBefore = before?.totalAmount ?? before?.value ?? null;

        let entityLabel = desc;
        if (category) entityLabel += ` • ${category}`;
        if (payerName) entityLabel += ` • pago por ${payerName}`;

        if (action === 'create' && amountAfter != null) {
          entityLabel += ` • ${formatCurrency(Number(amountAfter))}`;
        } else if (action === 'update' && amountBefore != null && amountAfter != null) {
          entityLabel += ` • ${formatCurrency(Number(amountBefore))} -> ${formatCurrency(Number(amountAfter))}`;
        } else if (action === 'delete' && amountAfter != null) {
          entityLabel += ` • ${formatCurrency(Number(amountAfter))}`;
        }

        const isAttachmentEvent = eventTypeStr.includes('ATTACHMENT');
        return {
          id: ev.id,
          action,
          entityType,
          entityLabel,
          actorName,
          actorId,
          at: ev.createdAt,
          isAttachmentEvent: isAttachmentEvent || undefined,
        };
      });

      // Mescla com o que já está na tela (pra não perder labels detalhadas).
      setAuditLog((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const entry of mapped) {
          if (!byId.has(entry.id)) byId.set(entry.id, entry);
        }
        return Array.from(byId.values())
          .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
          .slice(0, 40);
      });
    } finally {
      notificationsRefreshingRef.current = false;
    }
  }, [id, listActivityFeed, listUsers, recentJobCostIdsKey, members, authUser?.role]);

  useEffect(() => {
    if (!id) return;
    let intervalId: number | undefined;

    // tenta logo após carregar os custos
    if (recentJobCostIds.length > 0) {
      void refreshNotifications();
    }

    intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void refreshNotifications();
    }, 20000); // 20s

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [id, refreshNotifications, recentJobCostIdsKey]);

  if (!construction) {
    return (
      <MobileShell showNav={false}>
        <div className="flex items-center justify-center min-h-screen text-muted-foreground px-4 text-center">
          {loadingConstruction ? (
            "Carregando obra..."
          ) : constructionError ? (
            <div>
              <p className="mb-3">{constructionError}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadConstruction()}>
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
      addAudit(
        expenseId ? 'update' : 'create',
        'gasto',
        `${data.description} • ${data.category} • pago por ${payerFromUserId(data.paidByUserId)} • ${formatCurrency(data.totalValue)}${(data.attachments?.length ?? 0) > 0 ? ` • anexos: ${data.attachments.length}` : ''}`
      );
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
      addAudit(
        'delete',
        'gasto',
        `${expense.description} • ${expense.category} • pago por ${payerFromUserId(expense.paidByUserId)} • ${formatCurrency(expense.totalValue)}`
      );
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
      addAudit(
        costId ? 'update' : 'create',
        'legal',
        `${data.description} • ${data.type} • pago por ${payerFromUserId(data.paidByUserId)} • ${formatCurrency(data.value)}${(data.attachments?.length ?? 0) > 0 ? ` • anexos: ${data.attachments.length}` : ''}`
      );
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
      addAudit(
        'delete',
        'legal',
        `${cost.description} • ${cost.type} • pago por ${payerFromUserId(cost.paidByUserId)} • ${formatCurrency(cost.value)}`
      );
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
      addAudit(
        entryId ? 'update' : 'create',
        'mao-de-obra',
        `${data.service} • pago por ${payerFromUserId(data.paidByUserId)} • ${formatCurrency(data.value)}${(data.attachments?.length ?? 0) > 0 ? ` • anexos: ${data.attachments.length}` : ''}`
      );
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
      addAudit(
        'delete',
        'mao-de-obra',
        `${entry.service} • pago por ${payerFromUserId(entry.paidByUserId)} • ${formatCurrency(entry.value)}`
      );
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
    updateConstruction(id!, {
      status: 'VENDIDA',
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      soldAt: newSale.soldAt,
      saleNotes: newSale.notes,
    });
    addAudit(
      'create',
      'venda',
      `Venda: ${formatCurrency(data.saleValue)} • comissão: ${formatCurrency(data.commissionValue)} • impostos: ${formatCurrency(data.taxValue)} • outros: ${formatCurrency(data.otherClosingCosts)}`
    );
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
    updateConstruction(id!, {
      saleValue: data.saleValue,
      commissionValue: data.commissionValue,
      taxValue: data.taxValue,
      otherClosingCosts: data.otherClosingCosts,
      soldAt: sale.soldAt,
      saleNotes: data.notes ?? '',
    });
    addAudit(
      'update',
      'venda',
      `Venda atualizada: ${formatCurrency(data.saleValue)} • comissão: ${formatCurrency(data.commissionValue)} • impostos: ${formatCurrency(data.taxValue)} • outros: ${formatCurrency(data.otherClosingCosts)}`
    );
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

  const handleExportPdf = useCallback(() => {
    if (!construction) return;
    exportJobCostsToPdf({
      obraTitle: construction.title,
      obraAddress: construction.address || undefined,
      entries: jobCosts,
    });
  }, [construction, jobCosts]);

  return (
    <MobileShell showNav={false}>
      <div className="relative min-h-screen bg-background overflow-hidden">
        {/* Fundo sutil (sem imagem pesada) */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),transparent_50%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(circle_at_22%_18%,rgba(249,115,22,0.10),transparent_55%),radial-gradient(circle_at_82%_28%,rgba(59,130,246,0.08),transparent_55%)]" />

        <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-30 border-b border-border/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <EditableTitle
                initialTitle={construction.title}
                onSave={(t) => void handleSaveObra({ title: t })}
                readOnly={!isAdmin}
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setObraEditOpen(true)}
                  className="p-2 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Editar obra"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
            <Sheet open={notificationsOpen} onOpenChange={(open) => { setNotificationsOpen(open); if (!open) markNotificationsSeen(); }}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors"
                  aria-label="Notificações do sócio"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left">Notificações</SheetTitle>
                </SheetHeader>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Alterações feitas pelo outro sócio. Só aparecem aqui até você visualizar (fechar o painel).
                </p>
                {unreadNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">Nenhuma notificação nova.</p>
                ) : (
                <>
                  {unreadNotifications.length > NOTIF_PREVIEW_COUNT && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start mb-3"
                      onClick={() => {
                        setActiveTab('auditoria');
                        setNotificationsOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Ver tudo
                    </Button>
                  )}
                  <div className="max-h-[55vh] overflow-y-auto pr-1">
                    <AuditLogList
                      entries={unreadNotificationsPreview}
                      compact
                      pageSize={6}
                      lastSeenAt={null}
                      onEntryClick={(entry) => {
                        setNotificationsOpen(false);
                        handleAuditEntryClick(entry);
                      }}
                    />
                  </div>
                </>
                )}
              </SheetContent>
            </Sheet>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 px-2.5 shrink-0 text-[10px] font-extrabold uppercase tracking-wide"
              onClick={handleExportPdf}
              disabled={isPlatformSupport}
              title="Exportar todos os gastos por categoria (PDF)"
            >
              <FileDown className="w-4 h-4" />
              PDF gastos
            </Button>
            <StatusBadge status={construction.status} />
          </div>

          <ObraEditDrawer
            construction={construction}
            open={obraEditOpen}
            onOpenChange={setObraEditOpen}
            onSave={(data) => handleSaveObra(data)}
          />

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

        {/* Gastos por sócio — só na aba relevante, um valor por aba, visual premium */}
        {members.length > 0 && (activeTab === 'gastos' || activeTab === 'legais' || activeTab === 'mao-de-obra') && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2 px-0.5">
              {activeTab === 'gastos' && 'Gastos (obra) por sócio'}
              {activeTab === 'legais' && 'Custos legais por sócio'}
              {activeTab === 'mao-de-obra' && 'Mão de obra por sócio'}
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
              {gastosPorSocio.map((s, i) => {
                const value =
                  activeTab === 'gastos' ? s.gastos :
                  activeTab === 'legais' ? s.legais :
                  s.maoDeObra;
                const isFirst = i === 0;
                return (
                  <div
                    key={s.userId}
                    className="rounded-2xl border border-border/60 bg-card/70 shadow-card overflow-hidden flex-1 min-w-[140px]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border/60 via-border to-border/40" />
                    <div className="p-4">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {s.name}
                      </div>
                      <div className={`mt-1 font-mono font-extrabold tracking-tight ${isFirst ? 'text-primary' : 'text-accent'}`}>
                        {formatCurrency(value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  backgroundImage={{ src: kpiInvestimento, opacity: 0.22, position: 'center', size: 'cover', filter: 'contrast(1.06) saturate(1.04)' }}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <KpiCard
                  label="Lucro após venda"
                  value={totals.liquidProfit}
                  variant="primary"
                  emphasis="main"
                subtitle="Receita − investimento (custos) − comissão − impostos − outros"
                  icon={TrendingUp}
                  backgroundImage={{ src: kpiLucro, opacity: 0.22, position: 'center', size: 'cover', filter: 'contrast(1.06) saturate(1.04)' }}
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
                backgroundImage={{ src: kpiMateriais, opacity: 0.18, position: 'center', size: 'cover', filter: 'contrast(1.05) saturate(1.04)' }}
              />
              <KpiCard
                label="Serviços"
                value={totals.totalServiceCosts}
                variant="primary"
                subtitle="Execução e mobilização"
                icon={Hammer}
                backgroundImage={{ src: kpiServicos, opacity: 0.18, position: 'center', size: 'cover', filter: 'contrast(1.05) saturate(1.04)' }}
              />
              <KpiCard
                label="Legais"
                value={totals.totalLegalCosts}
                variant="neutral"
                subtitle="Custos de compliance"
                icon={Gavel}
                backgroundImage={{ src: kpiLegais, opacity: 0.18, position: 'center', size: 'cover', filter: 'contrast(1.05) saturate(1.04)' }}
              />
              <KpiCard
                label="Mão de obra"
                value={totals.totalLaborCosts}
                variant="primary"
                subtitle="Equipe e mão de obra"
                icon={Hammer}
                backgroundImage={{ src: kpiMaoDeObra, opacity: 0.18, position: 'center', size: 'cover', filter: 'contrast(1.05) saturate(1.04)' }}
              />
            </div>

            {sale?.saleValue && sale.saleValue > 0 ? (
              <div className="mt-1 rounded-2xl border border-border/50 bg-card/35 p-3">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">
                  Detalhamento do fechamento (venda)
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                  <span className="text-xs font-bold text-muted-foreground">Comissão:</span>
                  <span className="text-xs font-mono font-extrabold text-primary">
                    {formatCurrency(sale.commissionValue ?? 0)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">Impostos:</span>
                  <span className="text-xs font-mono font-extrabold text-accent">
                    {formatCurrency(sale.taxValue ?? 0)}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">Outros:</span>
                  <span className="text-xs font-mono font-extrabold text-primary/90">
                    {formatCurrency(sale.otherClosingCosts ?? 0)}
                  </span>
                </div>
              </div>
            ) : null}

            <SociosSettlementHero
              memberStats={totals.memberStats}
              onConfigureMembers={() => setMembersConfigOpen(true)}
              canConfigureMembers={authUser?.role === "ADMIN"}
            />

            <SociosCardsGrid memberStats={totals.memberStats} />

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

            {/* Tudo salvo: comprovantes e anexos da obra num só lugar */}
            <AllAttachmentsBlock documents={documents} jobCosts={jobCosts} />

            {/* Auditoria + Dossiê lado a lado na tela inicial */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border/55 bg-card/60 shadow-card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground">
                    Últimas atualizações
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0 h-8"
                    onClick={() => {
                      setActiveTab('auditoria');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Ver tudo
                  </Button>
                </div>
                <div className="border-t border-border/35 px-4 py-3">
                  <AuditLogList entries={auditLog.slice(0, 4)} compact pageSize={4} />
                </div>
              </div>

              <div className="rounded-3xl border border-border/55 bg-card/60 shadow-card overflow-hidden p-4">
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
                  await refresh('documents');
                }}
                onDelete={async (documentId) => {
                  await deleteJobSiteDocument(documentId);
                  await refresh('documents');
                }}
              />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gastos' && (
          <div className="space-y-4">
            {/* Card "Tudo lançado" — resumo geral dos gastos */}
            <div className="rounded-2xl border border-border/60 bg-card/70 shadow-card overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border/60 via-border to-border/40" />
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-3">
                  Tudo lançado (gastos da obra)
                </div>
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <div>
                    <span className="text-2xl font-mono font-extrabold text-primary tracking-tight">
                      {formatCurrency(totals.totalExpenses)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {expenses.length} {expenses.length === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
                        const c = e.category || 'Outros';
                        acc[c] = (acc[c] ?? 0) + e.totalValue;
                        return acc;
                      }, {});
                      const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
                      return cats.map(([name, value]) => (
                        <span
                          key={name}
                          className="text-[11px] font-medium text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-lg"
                        >
                          {name} {formatCurrency(value)}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>

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
                highlightedId={auditHighlightId}
              />
              <ExpenseFormDrawer members={members} open={expenseDrawerOpen} onOpenChange={setExpenseDrawerOpen} editingExpense={editingExpense} onSubmit={handleAddExpense} />
              <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'legais' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/70 shadow-card overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border/60 via-border to-border/40" />
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">
                  Total custos legais
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-primary tracking-tight">
                    {formatCurrency(totals.totalLegalCosts)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {legalCosts.length} {legalCosts.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
              <LegalCostList
              members={members}
              costs={legalCosts}
              onEdit={handleEditLegalCost}
              onDelete={handleDeleteLegalCost}
              canEdit={(cost) => canEditByAuthor(cost.createdByUserId)}
              highlightedId={auditHighlightId}
            />
              <LegalCostFormDrawer members={members} open={legalDrawerOpen} onOpenChange={setLegalDrawerOpen} editingCost={editingLegalCost} onSubmit={handleAddLegalCost} />
              <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'mao-de-obra' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/70 shadow-card overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border/60 via-border to-border/40" />
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground mb-2">
                  Total mão de obra
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-extrabold text-primary tracking-tight">
                    {formatCurrency(totals.totalLaborCosts)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {laborEntries.length} {laborEntries.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card/30 p-4 shadow-sm space-y-4">
                <LaborList
                members={members}
                entries={laborEntries}
                onEdit={handleEditLaborEntry}
                onDelete={handleDeleteLaborEntry}
                canEdit={(entry) => canEditByAuthor(entry.createdByUserId)}
                highlightedId={auditHighlightId}
              />
              <LaborFormDrawer members={members} open={laborDrawerOpen} onOpenChange={setLaborDrawerOpen} editingEntry={editingLaborEntry} onSubmit={handleAddLabor} />
              <Button size="lg" className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-card" onClick={openNewDrawer}>
                <Plus className="w-6 h-6" />
              </Button>
            </div>
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
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                <AuditLogList entries={auditLog} compact pageSize={6} onEntryClick={handleAuditEntryClick} />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </MobileShell>
  );
};

export default ObraDetail;
