export function pickJobCostEntryFields(row: any) {
  return {
    id: row.id,
    companyId: row.companyId,
    jobSiteId: row.jobSiteId,
    date: row.date,
    source: row.source,
    category: row.category,
    description: row.description,
    weekLabel: row.weekLabel ?? null,
    quantity: row.quantity ?? null,
    unitPrice: row.unitPrice ?? null,
    totalAmount: row.totalAmount,
    payer: row.payer,
    supplier: row.supplier ?? null,
    invoiceNumber: row.invoiceNumber ?? null,
    paymentMethod: row.paymentMethod ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    version: row.version,
    deviceId: row.deviceId ?? null,
    lastSyncedAt: row.lastSyncedAt ?? null,
    createdByUserId: row.createdByUserId ?? null,
    updatedByUserId: row.updatedByUserId ?? null,
    deletedByUserId: row.deletedByUserId ?? null,

    createdByUser: row.createdByUser
      ? {
          id: row.createdByUser.id,
          name: row.createdByUser.name ?? null,
          email: row.createdByUser.email ?? null,
        }
      : null,
    updatedByUser: row.updatedByUser
      ? {
          id: row.updatedByUser.id,
          name: row.updatedByUser.name ?? null,
          email: row.updatedByUser.email ?? null,
        }
      : null,
    deletedByUser: row.deletedByUser
      ? {
          id: row.deletedByUser.id,
          name: row.deletedByUser.name ?? null,
          email: row.deletedByUser.email ?? null,
        }
      : null,
  };
}
