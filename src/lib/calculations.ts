import type { Expense, LegalCost, LaborEntry, Sale, ConstructionMember, ObraTotals, MemberStats } from '@/types';

export const calculateObraTotals = (
  expenses: Expense[],
  legalCosts: LegalCost[],
  laborEntries: LaborEntry[],
  members: ConstructionMember[],
  sale?: Sale
): ObraTotals => {
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.totalValue), 0);
  const totalLegalCosts = legalCosts.reduce((acc, l) => acc + Number(l.value), 0);
  const totalLaborCosts = laborEntries.reduce((acc, l) => acc + Number(l.value), 0);
  const grandTotal = totalExpenses + totalLegalCosts + totalLaborCosts;

  const saleValue = sale?.saleValue ?? 0;
  const totalDeductions = (sale?.commissionValue ?? 0) + (sale?.taxValue ?? 0) + (sale?.otherClosingCosts ?? 0);
  const liquidProfit = saleValue > 0 ? saleValue - grandTotal - totalDeductions : 0;

  const memberStats: MemberStats[] = members.map((member) => {
    const paidExpenses = expenses.filter(e => e.paidByUserId === member.userId).reduce((a, b) => a + Number(b.totalValue), 0);
    const paidLegal = legalCosts.filter(l => l.paidByUserId === member.userId).reduce((a, b) => a + Number(b.value), 0);
    const paidLabor = laborEntries.filter(l => l.paidByUserId === member.userId).reduce((a, b) => a + Number(b.value), 0);
    const totalPaid = paidExpenses + paidLegal + paidLabor;

    const idealContribution = grandTotal * (member.sharePercent / 100);
    const balance = totalPaid - idealContribution; // positivo = pagou a mais, negativo = pagou a menos
    const profitShare = liquidProfit * (member.sharePercent / 100);
    // Acerto final: lucro da parte + saldo do rateio → positivo = recebe, negativo = paga
    const finalSettlement = profitShare + balance;

    return {
      userId: member.userId,
      name: member.name,
      sharePercent: member.sharePercent,
      totalPaid,
      idealContribution,
      balance,
      profitShare,
      finalSettlement,
    };
  });

  return {
    totalExpenses,
    totalLegalCosts,
    totalLaborCosts,
    grandTotal,
    liquidProfit,
    memberStats,
  };
};
