import {
  LedgerTransaction,
  BankTransaction,
  ReconciliationParameters,
  ReconciliationResult,
  MatchedPair,
  DiscrepancyItem,
  JournalEntry,
} from "../types";

function cleanStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
}

function extractReferenceTokens(ref: any): string[] {
  if (!ref) return [];
  const cleaned = String(ref).replace(/[^a-zA-Z0-9]/g, " ").trim();
  const tokens = cleaned
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.toLowerCase());
  const digits = String(ref).match(/\d{3,}/g) || [];
  return Array.from(new Set([...tokens, ...digits.map((d) => d.toLowerCase())]));
}

function parseDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  const dateStr = String(dateVal).trim();

  // Try standard YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function textSimilarity(s1: string, s2: string): number {
  const a = cleanStr(s1);
  const b = cleanStr(s2);
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;

  // Bigram token similarity (Dice's coefficient)
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  if (bgA.size === 0 || bgB.size === 0) return 0.0;

  let intersection = 0;
  bgA.forEach((bg) => {
    if (bgB.has(bg)) intersection++;
  });

  return (2.0 * intersection) / (bgA.size + bgB.size);
}

export function reconcileTransactions(payload: {
  ledger_transactions?: LedgerTransaction[];
  ledgerTransactions?: LedgerTransaction[];
  bank_transactions?: BankTransaction[];
  bankTransactions?: BankTransaction[];
  parameters?: Partial<ReconciliationParameters>;
}): ReconciliationResult {
  const ledgerItems = payload.ledger_transactions || payload.ledgerTransactions || [];
  const bankItems = payload.bank_transactions || payload.bankTransactions || [];
  const params = payload.parameters || {};

  const dateTolerance = Number(params.date_tolerance_days ?? 5);
  const amountTolerance = Number(params.amount_tolerance ?? 0.05);
  const initialLedgerBalance = Number(params.initial_ledger_balance ?? 0.0);
  const initialBankBalance = Number(params.initial_bank_balance ?? 0.0);

  // Pre-process ledger items
  const processedLedger = ledgerItems.map((item, idx) => {
    const debit = Number(item.debit || 0.0);
    const credit = Number(item.credit || 0.0);
    const netAmount =
      debit > 0 || credit > 0 ? debit - credit : Number(item.amount || 0.0);
    const dt = parseDate(item.date);

    return {
      index: idx,
      id: item.id || `LEDG_${idx + 1}`,
      date_raw: item.date || "",
      date: dt ? dt.toISOString().split("T")[0] : String(item.date || ""),
      datetime: dt,
      reference: String(item.reference || "").trim(),
      description: String(item.description || "").trim(),
      debit,
      credit,
      amount: Math.round(netAmount * 100) / 100,
      abs_amount: Math.round(Math.abs(netAmount) * 100) / 100,
      flow_type: netAmount > 0 ? "INFLOW" : netAmount < 0 ? "OUTFLOW" : "ZERO",
      matched: false,
      match_id: null as string | null,
    };
  });

  // Pre-process bank items
  const processedBank = bankItems.map((item, idx) => {
    const inflow = Number(item.inflow || 0.0);
    const outflow = Number(item.outflow || 0.0);
    const netAmount =
      inflow > 0 || outflow > 0 ? inflow - outflow : Number(item.amount || 0.0);
    const dt = parseDate(item.date);

    return {
      index: idx,
      id: item.id || `BANK_${idx + 1}`,
      date_raw: item.date || "",
      date: dt ? dt.toISOString().split("T")[0] : String(item.date || ""),
      datetime: dt,
      reference: String(item.reference || "").trim(),
      description: String(item.description || "").trim(),
      inflow,
      outflow,
      amount: Math.round(netAmount * 100) / 100,
      abs_amount: Math.round(Math.abs(netAmount) * 100) / 100,
      flow_type: netAmount > 0 ? "INFLOW" : netAmount < 0 ? "OUTFLOW" : "ZERO",
      matched: false,
      match_id: null as string | null,
    };
  });

  const matchedPairs: MatchedPair[] = [];
  const discrepancies: DiscrepancyItem[] = [];
  let matchCounter = 1;

  // PASS 1: Exact Match (Reference match + Exact Amount within tolerance + Flow Polarity)
  for (const l of processedLedger) {
    if (l.matched || !l.reference) continue;
    const lTokens = extractReferenceTokens(l.reference);
    if (lTokens.length === 0) continue;

    let bestBankMatch: typeof processedBank[0] | null = null;
    let minDateDiff = 9999;

    for (const b of processedBank) {
      if (b.matched) continue;
      if (l.flow_type !== b.flow_type && l.flow_type !== "ZERO" && b.flow_type !== "ZERO") continue;
      if (Math.abs(l.abs_amount - b.abs_amount) > amountTolerance) continue;

      const bTokens = extractReferenceTokens(b.reference);
      const tokenIntersection = lTokens.filter((tok) => bTokens.includes(tok));
      const exactRefMatch = cleanStr(l.reference) === cleanStr(b.reference);

      if (tokenIntersection.length > 0 || exactRefMatch) {
        const dateDiff =
          l.datetime && b.datetime
            ? Math.abs(Math.round((l.datetime.getTime() - b.datetime.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        if (dateDiff <= dateTolerance && dateDiff < minDateDiff) {
          minDateDiff = dateDiff;
          bestBankMatch = b;
        }
      }
    }

    if (bestBankMatch) {
      l.matched = true;
      bestBankMatch.matched = true;
      const mid = `MATCH_${String(matchCounter++).padStart(4, "0")}`;
      l.match_id = mid;
      bestBankMatch.match_id = mid;
      matchedPairs.push({
        match_id: mid,
        tier: "EXACT_REFERENCE_AND_AMOUNT",
        tier_name: "Coincidencia Exacta de Referencia e Importe",
        status: "CONCILIADO",
        ledger_item: l,
        bank_item: bestBankMatch,
        variance: 0.0,
        date_diff_days: minDateDiff,
        audit_note: `Coincidencia plena de referencia '${l.reference}' y saldo de ${l.amount} con ${minDateDiff} días de desfase.`,
      });
    }
  }

  // PASS 2: Exact Amount & High Description Similarity
  for (const l of processedLedger) {
    if (l.matched) continue;
    let bestBankMatch: typeof processedBank[0] | null = null;
    let bestScore = 0.0;
    let minDateDiff = 9999;

    for (const b of processedBank) {
      if (b.matched) continue;
      if (l.flow_type !== b.flow_type && l.flow_type !== "ZERO" && b.flow_type !== "ZERO") continue;
      if (Math.abs(l.abs_amount - b.abs_amount) > amountTolerance) continue;

      const dateDiff =
        l.datetime && b.datetime
          ? Math.abs(Math.round((l.datetime.getTime() - b.datetime.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

      if (dateDiff > dateTolerance) continue;

      const sim = textSimilarity(l.description, b.description);
      const score = sim + 1.0 / (dateDiff + 1);

      if (sim >= 0.35 && score > bestScore) {
        bestScore = score;
        bestBankMatch = b;
        minDateDiff = dateDiff;
      }
    }

    if (bestBankMatch) {
      l.matched = true;
      bestBankMatch.matched = true;
      const mid = `MATCH_${String(matchCounter++).padStart(4, "0")}`;
      l.match_id = mid;
      bestBankMatch.match_id = mid;
      matchedPairs.push({
        match_id: mid,
        tier: "FUZZY_DESCRIPTION_AND_AMOUNT",
        tier_name: "Coincidencia por Importe y Concepto Semántico",
        status: "CONCILIADO_SEMANTICO",
        ledger_item: l,
        bank_item: bestBankMatch,
        variance: 0.0,
        date_diff_days: minDateDiff,
        audit_note: `Importe idéntico ${l.amount} con concepto compatible: '${l.description.slice(0, 30)}' vs '${bestBankMatch.description.slice(0, 30)}'.`,
      });
    }
  }

  // PASS 3: Discrepancy Detection - Reference Matches but Amount Differs!
  for (const l of processedLedger) {
    if (l.matched || !l.reference) continue;
    const lTokens = extractReferenceTokens(l.reference);
    if (lTokens.length === 0) continue;

    for (const b of processedBank) {
      if (b.matched) continue;
      const bTokens = extractReferenceTokens(b.reference);
      const tokenIntersection = lTokens.filter((tok) => bTokens.includes(tok));
      const exactRefMatch = cleanStr(l.reference) === cleanStr(b.reference);

      if (tokenIntersection.length > 0 || exactRefMatch) {
        const diff = Math.round((l.amount - b.amount) * 100) / 100;
        const absDiff = Math.round(Math.abs(diff) * 100) / 100;

        if (absDiff > amountTolerance) {
          l.matched = true;
          b.matched = true;
          const did = `DISC_${String(discrepancies.length + 1).padStart(4, "0")}`;
          l.match_id = did;
          b.match_id = did;

          const risk: "ALTA" | "MEDIA" | "BAJA" = absDiff > 1000 ? "ALTA" : "MEDIA";
          let probableCause = "Diferencia de Importe en Documento";
          if (Math.round(absDiff) === absDiff && Math.round(absDiff) % 9 === 0) {
            probableCause = "Posible Error de Transposición / Digitación (divisible por 9)";
          }

          discrepancies.push({
            id: did,
            category: "DIFERENCIA_DE_IMPORTE",
            title: `Diferencia de Monto en Referencia ${l.reference}`,
            risk_level: risk,
            probable_cause: probableCause,
            ledger_item: l,
            bank_item: b,
            ledger_amount: l.amount,
            bank_amount: b.amount,
            variance: diff,
            abs_variance: absDiff,
            remediation: `Generar asiento de ajuste contable por ${absDiff.toLocaleString()} contra cuenta de Diferencias por Conciliación o Proveedores/Clientes.`,
            audit_impact: `Libro registra ${l.amount.toLocaleString()} mientras el banco liquidó ${b.amount.toLocaleString()}. Descuadre neto: ${diff.toLocaleString()}.`,
          });
          break;
        }
      }
    }
  }

  // PASS 4: Unmatched Ledger Transactions
  const unmatchedLedger = processedLedger.filter((l) => !l.matched);
  for (const l of unmatchedLedger) {
    const did = `DISC_${String(discrepancies.length + 1).padStart(4, "0")}`;
    let category = "";
    let title = "";
    let risk: "ALTA" | "MEDIA" | "BAJA" = "MEDIA";
    let remediation = "";

    if (l.flow_type === "OUTFLOW") {
      category = "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO";
      title = `Egreso en Tránsito (No cobrado en banco): ${l.reference || l.description}`;
      risk = Math.abs(l.amount) < 2000 ? "BAJA" : "MEDIA";
      remediation =
        "Verificar vigencia del cheque o fecha valor de la transferencia con el beneficiario. Si supera 90 días, reclasificar.";
    } else {
      category = "DEPOSITO_EN_TRANSITO";
      title = `Depósito en Tránsito (No acreditado en banco): ${l.reference || l.description}`;
      risk = "MEDIA";
      remediation = "Confirmar con el banco la retención de canje o solicitud de confirmación de depósito.";
    }

    discrepancies.push({
      id: did,
      category,
      title,
      risk_level: risk,
      probable_cause: "Partida pendiente de procesar en el corte bancario",
      ledger_item: l,
      bank_item: null,
      ledger_amount: l.amount,
      bank_amount: 0.0,
      variance: l.amount,
      abs_variance: Math.round(Math.abs(l.amount) * 100) / 100,
      remediation,
      audit_impact: `Afecta el saldo disponible real. Partida en libros por ${l.amount.toLocaleString()} sin reflejo bancario.`,
    });
  }

  // PASS 5: Unmatched Bank Transactions
  const unmatchedBank = processedBank.filter((b) => !b.matched);
  for (const b of unmatchedBank) {
    const did = `DISC_${String(discrepancies.length + 1).padStart(4, "0")}`;
    const bDescClean = cleanStr(b.description);

    let category = "";
    let title = "";
    let risk: "ALTA" | "MEDIA" | "BAJA" = "MEDIA";
    let remediation = "";

    if (
      /comision|comisión|fee|mantenimiento|cuota|gravamen|gmf|4x1000|iva|interes debito/i.test(
        bDescClean
      )
    ) {
      category = "NOTA_DEBITO_BANCARIA_NO_REGISTRADA";
      title = `Comisión / Débito Bancario No Contabilizado: ${b.description.slice(0, 40)}`;
      risk = "MEDIA";
      remediation = `Registrar Asiento Contable: Débito a Gastos Bancarios / Impuestos por ${Math.abs(b.amount).toLocaleString()} con Crédito a Banco.`;
    } else if (b.flow_type === "INFLOW") {
      category = "NOTA_CREDITO_BANCARIA_NO_REGISTRADA";
      title = `Abono Bancario No Identificado / Rendimientos: ${b.description.slice(0, 40)}`;
      risk = Math.abs(b.amount) > 3000 ? "ALTA" : "MEDIA";
      remediation = `Identificar tercero o registrar ingreso financiero por ${Math.abs(b.amount).toLocaleString()} en contabilidad.`;
    } else {
      category = "CARGO_BANCARIO_NO_IDENTIFICADO";
      title = `Cargo Bancario Desconocido: ${b.description.slice(0, 40)}`;
      risk = "ALTA";
      remediation = `Solicitar soporte y copia de comprobante a la entidad bancaria por cobro de ${Math.abs(b.amount).toLocaleString()}.`;
    }

    discrepancies.push({
      id: did,
      category,
      title,
      risk_level: risk,
      probable_cause:
        "Movimiento debitado o acreditado por el banco no registrado oportunamente en el auxiliar",
      ledger_item: null,
      bank_item: b,
      ledger_amount: 0.0,
      bank_amount: b.amount,
      variance: Math.round(-b.amount * 100) / 100,
      abs_variance: Math.round(Math.abs(b.amount) * 100) / 100,
      remediation,
      audit_impact: `Divergencia que requiere ajuste en libros contables por ${b.amount.toLocaleString()}.`,
    });
  }

  // Calculate financial and audit totals
  const totalLedgerDebits = Math.round(processedLedger.reduce((sum, l) => sum + l.debit, 0) * 100) / 100;
  const totalLedgerCredits = Math.round(processedLedger.reduce((sum, l) => sum + l.credit, 0) * 100) / 100;
  const netLedgerMovement = Math.round(processedLedger.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
  const finalLedgerBalance = Math.round((initialLedgerBalance + netLedgerMovement) * 100) / 100;

  const totalBankInflows = Math.round(processedBank.reduce((sum, b) => sum + b.inflow, 0) * 100) / 100;
  const totalBankOutflows = Math.round(processedBank.reduce((sum, b) => sum + b.outflow, 0) * 100) / 100;
  const netBankMovement = Math.round(processedBank.reduce((sum, b) => sum + b.amount, 0) * 100) / 100;
  const finalBankBalance = Math.round((initialBankBalance + netBankMovement) * 100) / 100;

  // Reconciliation Formula Components
  const chequesTransito =
    Math.round(
      discrepancies
        .filter((d) => d.category === "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO")
        .reduce((sum, d) => sum + Math.abs(d.ledger_amount), 0) * 100
    ) / 100;

  const depositosTransito =
    Math.round(
      discrepancies
        .filter((d) => d.category === "DEPOSITO_EN_TRANSITO")
        .reduce((sum, d) => sum + Math.abs(d.ledger_amount), 0) * 100
    ) / 100;

  const notasDebitoBanco =
    Math.round(
      discrepancies
        .filter((d) =>
          ["NOTA_DEBITO_BANCARIA_NO_REGISTRADA", "CARGO_BANCARIO_NO_IDENTIFICADO"].includes(d.category)
        )
        .reduce((sum, d) => sum + Math.abs(d.bank_amount), 0) * 100
    ) / 100;

  const notasCreditoBanco =
    Math.round(
      discrepancies
        .filter((d) => d.category === "NOTA_CREDITO_BANCARIA_NO_REGISTRADA")
        .reduce((sum, d) => sum + Math.abs(d.bank_amount), 0) * 100
    ) / 100;

  const diferenciasMontoNetas =
    Math.round(
      discrepancies
        .filter((d) => d.category === "DIFERENCIA_DE_IMPORTE")
        .reduce((sum, d) => sum + d.variance, 0) * 100
    ) / 100;

  const saldoLibrosAjustado =
    Math.round(
      (finalLedgerBalance - notasDebitoBanco + notasCreditoBanco - diferenciasMontoNetas) * 100
    ) / 100;

  const saldoBancoAjustado =
    Math.round((finalBankBalance + depositosTransito - chequesTransito) * 100) / 100;

  const cuadreGap = Math.round(Math.abs(saldoLibrosAjustado - saldoBancoAjustado) * 100) / 100;
  const conciledRate =
    Math.round(
      ((matchedPairs.length * 2) / Math.max(1, processedLedger.length + processedBank.length)) * 1000
    ) / 10;

  // Risk distribution
  const highRiskCount = discrepancies.filter((d) => d.risk_level === "ALTA").length;
  const medRiskCount = discrepancies.filter((d) => d.risk_level === "MEDIA").length;
  const lowRiskCount = discrepancies.filter((d) => d.risk_level === "BAJA").length;

  // Suggested Journal Adjustments
  const suggestedAdjustments: JournalEntry[] = [];
  let asientoIdx = 1;

  // 1. Comisiones y gastos bancarios
  const comisionesItems = discrepancies.filter(
    (d) => d.category === "NOTA_DEBITO_BANCARIA_NO_REGISTRADA"
  );
  if (comisionesItems.length > 0) {
    const totalCom =
      Math.round(comisionesItems.reduce((sum, d) => sum + d.abs_variance, 0) * 100) / 100;
    suggestedAdjustments.push({
      asiento_num: `AJUSTE-${String(asientoIdx++).padStart(2, "0")}`,
      concepto: "Reconocimiento de Gastos Bancarios, Comisiones e Impuestos no contabilizados",
      entries: [
        { cuenta: "530515 - Comisiones y Gastos Bancarios", tipo: "DEBE", monto: totalCom },
        { cuenta: "111005 - Moneda Nacional (Bancos)", tipo: "HABER", monto: totalCom },
      ],
      total: totalCom,
    });
  }

  // 2. Abonos o rendimientos no contabilizados
  const abonosItems = discrepancies.filter(
    (d) => d.category === "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"
  );
  if (abonosItems.length > 0) {
    const totalAb = Math.round(abonosItems.reduce((sum, d) => sum + d.abs_variance, 0) * 100) / 100;
    suggestedAdjustments.push({
      asiento_num: `AJUSTE-${String(asientoIdx++).padStart(2, "0")}`,
      concepto: "Registro de Abonos Bancarios y Rendimientos Financieros Recibidos",
      entries: [
        { cuenta: "111005 - Moneda Nacional (Bancos)", tipo: "DEBE", monto: totalAb },
        { cuenta: "421005 - Rendimientos Financieros / Anticipos Clientes", tipo: "HABER", monto: totalAb },
      ],
      total: totalAb,
    });
  }

  // 3. Corrección por errores de importe
  const difItems = discrepancies.filter((d) => d.category === "DIFERENCIA_DE_IMPORTE");
  for (const d of difItems) {
    const v = d.variance;
    const absV = Math.round(Math.abs(v) * 100) / 100;
    if (v > 0) {
      suggestedAdjustments.push({
        asiento_num: `AJUSTE-${String(asientoIdx++).padStart(2, "0")}`,
        concepto: `Corrección digitación Ref ${d.ledger_item?.reference}: Saldo en libros superior al bancario`,
        entries: [
          { cuenta: "220505 - Proveedores / Cuentas por Pagar (Ajuste)", tipo: "DEBE", monto: absV },
          { cuenta: "111005 - Moneda Nacional (Bancos)", tipo: "HABER", monto: absV },
        ],
        total: absV,
      });
    } else {
      suggestedAdjustments.push({
        asiento_num: `AJUSTE-${String(asientoIdx++).padStart(2, "0")}`,
        concepto: `Corrección digitación Ref ${d.ledger_item?.reference}: Saldo en banco superior al libro`,
        entries: [
          { cuenta: "111005 - Moneda Nacional (Bancos)", tipo: "DEBE", monto: absV },
          { cuenta: "220505 - Proveedores / Cuentas por Pagar (Ajuste)", tipo: "HABER", monto: absV },
        ],
        total: absV,
      });
    }
  }

  // Charts
  const comparativeSummary = [
    {
      categoria: "Entradas / Abonos",
      Libro_Auxiliar: totalLedgerDebits,
      Extracto_Bancario: totalBankInflows,
      Diferencia: Math.round((totalLedgerDebits - totalBankInflows) * 100) / 100,
    },
    {
      categoria: "Salidas / Cargos",
      Libro_Auxiliar: totalLedgerCredits,
      Extracto_Bancario: totalBankOutflows,
      Diferencia: Math.round((totalLedgerCredits - totalBankOutflows) * 100) / 100,
    },
    {
      categoria: "Flujo Neto Periodo",
      Libro_Auxiliar: netLedgerMovement,
      Extracto_Bancario: netBankMovement,
      Diferencia: Math.round((netLedgerMovement - netBankMovement) * 100) / 100,
    },
    {
      categoria: "Saldo Final Periodo",
      Libro_Auxiliar: finalLedgerBalance,
      Extracto_Bancario: finalBankBalance,
      Diferencia: Math.round((finalLedgerBalance - finalBankBalance) * 100) / 100,
    },
  ];

  const discrepancyCategories = [
    {
      name: "Diferencia de Importe",
      count: discrepancies.filter((d) => d.category === "DIFERENCIA_DE_IMPORTE").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "DIFERENCIA_DE_IMPORTE")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
    {
      name: "Cheques en Tránsito",
      count: discrepancies.filter((d) => d.category === "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
    {
      name: "Depósitos en Tránsito",
      count: discrepancies.filter((d) => d.category === "DEPOSITO_EN_TRANSITO").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "DEPOSITO_EN_TRANSITO")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
    {
      name: "Notas Débito Banco",
      count: discrepancies.filter((d) => d.category === "NOTA_DEBITO_BANCARIA_NO_REGISTRADA").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "NOTA_DEBITO_BANCARIA_NO_REGISTRADA")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
    {
      name: "Notas Crédito Banco",
      count: discrepancies.filter((d) => d.category === "NOTA_CREDITO_BANCARIA_NO_REGISTRADA").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "NOTA_CREDITO_BANCARIA_NO_REGISTRADA")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
    {
      name: "Cargos No Identificados",
      count: discrepancies.filter((d) => d.category === "CARGO_BANCARIO_NO_IDENTIFICADO").length,
      amount:
        Math.round(
          discrepancies
            .filter((d) => d.category === "CARGO_BANCARIO_NO_IDENTIFICADO")
            .reduce((sum, d) => sum + d.abs_variance, 0) * 100
        ) / 100,
    },
  ];

  const waterfallBalance = [
    { etapa: "1. Saldo Libros", valor: finalLedgerBalance, acumulado: finalLedgerBalance },
    {
      etapa: "2. (+) Cheques Tránsito",
      valor: chequesTransito,
      acumulado: Math.round((finalLedgerBalance + chequesTransito) * 100) / 100,
    },
    {
      etapa: "3. (-) Depósitos Tránsito",
      valor: -depositosTransito,
      acumulado: Math.round((finalLedgerBalance + chequesTransito - depositosTransito) * 100) / 100,
    },
    {
      etapa: "4. (+) Notas Crédito",
      valor: notasCreditoBanco,
      acumulado:
        Math.round((finalLedgerBalance + chequesTransito - depositosTransito + notasCreditoBanco) * 100) /
        100,
    },
    {
      etapa: "5. (-) Notas Débito",
      valor: -notasDebitoBanco,
      acumulado:
        Math.round(
          (finalLedgerBalance + chequesTransito - depositosTransito + notasCreditoBanco - notasDebitoBanco) *
            100
        ) / 100,
    },
    { etapa: "6. Saldo Banco Real", valor: finalBankBalance, acumulado: finalBankBalance },
  ];

  const auditVerdict =
    cuadreGap < 1.0 ? "CUADRE_CONCILIATORIO_EXITOSO" : "DESCUADRE_MATERIAL_DETECTADO";

  const totalDiscrepanciesAmount = Math.round(
    discrepancies.reduce((sum, d) => sum + d.abs_variance, 0) * 100
  ) / 100;

  const executiveNarrative =
    `Dictamen de Auditoría: Se analizaron ${processedLedger.length} registros del Libro Auxiliar Contable y ` +
    `${processedBank.length} registros del Extracto Bancario. El índice de conciliación automática alcanzó el ${conciledRate}%, ` +
    `identificando ${matchedPairs.length} partidas coincidentes plenamente. Se determinaron ${discrepancies.length} partidas conciliatorias ` +
    `y discrepancias por un valor total absoluto de $${totalDiscrepanciesAmount.toLocaleString()}. ` +
    `El saldo final contable se fijó en $${finalLedgerBalance.toLocaleString()} frente a un saldo bancario de $${finalBankBalance.toLocaleString()}. ` +
    `Aplicando el modelo de cédula sumaria bancaria (considerando cheques en tránsito por $${chequesTransito.toLocaleString()}, depósitos en tránsito por $${depositosTransito.toLocaleString()}, ` +
    `notas de débito por $${notasDebitoBanco.toLocaleString()} y notas de crédito por $${notasCreditoBanco.toLocaleString()}), el gap de cuadre ajustado es de $${cuadreGap.toLocaleString()}.`;

  // Strip datetime for clean response
  const sanitizedLedger = processedLedger.map(({ datetime, ...rest }) => rest);
  const sanitizedBank = processedBank.map(({ datetime, ...rest }) => rest);

  return {
    engine: "ConciliaData Dual Core (Python & TS Vercel Engine)",
    timestamp: new Date().toISOString(),
    verdict: auditVerdict,
    executive_narrative: executiveNarrative,
    summary: {
      ledger_records_count: processedLedger.length,
      bank_records_count: processedBank.length,
      matched_count: matchedPairs.length,
      discrepancies_count: discrepancies.length,
      reconciliation_rate_pct: conciledRate,
      initial_ledger_balance: initialLedgerBalance,
      final_ledger_balance: finalLedgerBalance,
      total_ledger_debits: totalLedgerDebits,
      total_ledger_credits: totalLedgerCredits,
      net_ledger_movement: netLedgerMovement,
      initial_bank_balance: initialBankBalance,
      final_bank_balance: finalBankBalance,
      total_bank_inflows: totalBankInflows,
      total_bank_outflows: totalBankOutflows,
      net_bank_movement: netBankMovement,
      saldo_libros_ajustado: saldoLibrosAjustado,
      saldo_banco_ajustado: saldoBancoAjustado,
      cuadre_gap: cuadreGap,
      cheques_transito: chequesTransito,
      depositos_transito: depositosTransito,
      notas_debito_banco: notasDebitoBanco,
      notas_credito_banco: notasCreditoBanco,
      diferencias_monto_netas: diferenciasMontoNetas,
      risk_distribution: {
        alta: highRiskCount,
        media: medRiskCount,
        baja: lowRiskCount,
      },
    },
    matched_pairs: matchedPairs,
    discrepancies,
    suggested_adjustments: suggestedAdjustments,
    charts: {
      comparative_summary: comparativeSummary,
      discrepancy_categories: discrepancyCategories,
      waterfall_balance: waterfallBalance,
    },
    raw_ledger: sanitizedLedger,
    raw_bank: sanitizedBank,
  };
}
