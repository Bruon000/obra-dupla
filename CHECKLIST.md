## M3 — Clientes 100% offline + sync

- [ ] UX: feedback de sync (loading / ok / erro)

---

## M4 — Custos da obra + comprovantes

**Definition of Done**

- Existe entidade de custo por obra vinculada a `JobSite`
- Existe anexo de comprovante por custo
- Funciona offline-first com sync
- Base pronta para tela mobile de lançamento rápido

**Tarefas**

- [ ] Prisma: `JobCostEntry`
- [ ] Prisma: `JobCostAttachment`
- [ ] Dexie: `jobCostEntries`
- [ ] Dexie: `jobCostAttachments`
- [ ] Sync backend/client dessas entidades
- [ ] Endpoint base `/job-costs`
- [ ] Resumo por pagador/sócio
- [ ] Upload de foto/PDF de comprovante
