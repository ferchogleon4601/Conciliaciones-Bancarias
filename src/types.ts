export interface LedgerTransaction {
  id?: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  amount?: number;
  balance?: number;
}

export interface BankTransaction {
  id?: string;
  date: string;
  reference: string;
  description: string;
  inflow: number;
  outflow: number;
  amount?: number;
  balance?: number;
}

export interface ReconciliationParameters {
  date_tolerance_days: number;
  amount_tolerance: number;
  initial_ledger_balance: number;
  initial_bank_balance: number;
  currency: string;
  company_name: string;
  bank_name: string;
  account_number: string;
  period_label: string;
}

export interface MatchedPair {
  match_id: string;
  tier: string;
  tier_name: string;
  status: string;
  ledger_item: any;
  bank_item: any;
  variance: number;
  date_diff_days: number;
  audit_note: string;
}

export interface DiscrepancyItem {
  id: string;
  category:
    | "DIFERENCIA_DE_IMPORTE"
    | "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO"
    | "DEPOSITO_EN_TRANSITO"
    | "NOTA_DEBITO_BANCARIA_NO_REGISTRADA"
    | "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"
    | "CARGO_BANCARIO_NO_IDENTIFICADO"
    | string;
  title: string;
  risk_level: "ALTA" | "MEDIA" | "BAJA";
  probable_cause: string;
  ledger_item: any | null;
  bank_item: any | null;
  ledger_amount: number;
  bank_amount: number;
  variance: number;
  abs_variance: number;
  remediation: string;
  audit_impact: string;
}

export interface JournalEntry {
  asiento_num: string;
  concepto: string;
  entries: Array<{
    cuenta: string;
    tipo: "DEBE" | "HABER";
    monto: number;
  }>;
  total: number;
}

export interface ReconciliationResult {
  engine: string;
  timestamp: string;
  verdict: "CUADRE_CONCILIATORIO_EXITOSO" | "DESCUADRE_MATERIAL_DETECTADO" | string;
  executive_narrative: string;
  summary: {
    ledger_records_count: number;
    bank_records_count: number;
    matched_count: number;
    discrepancies_count: number;
    reconciliation_rate_pct: number;
    initial_ledger_balance: number;
    final_ledger_balance: number;
    total_ledger_debits: number;
    total_ledger_credits: number;
    net_ledger_movement: number;
    initial_bank_balance: number;
    final_bank_balance: number;
    total_bank_inflows: number;
    total_bank_outflows: number;
    net_bank_movement: number;
    saldo_libros_ajustado: number;
    saldo_banco_ajustado: number;
    cuadre_gap: number;
    cheques_transito: number;
    depositos_transito: number;
    notas_debito_banco: number;
    notas_credito_banco: number;
    diferencias_monto_netas: number;
    risk_distribution: {
      alta: number;
      media: number;
      baja: number;
    };
  };
  matched_pairs: MatchedPair[];
  discrepancies: DiscrepancyItem[];
  suggested_adjustments: JournalEntry[];
  charts: {
    comparative_summary: Array<{
      categoria: string;
      Libro_Auxiliar: number;
      Extracto_Bancario: number;
      Diferencia: number;
    }>;
    discrepancy_categories: Array<{
      name: string;
      count: number;
      amount: number;
    }>;
    waterfall_balance: Array<{
      etapa: string;
      valor: number;
      acumulado: number;
    }>;
  };
  raw_ledger: any[];
  raw_bank: any[];
}

export interface AIAuditAnalysis {
  opinion_dictamen: string;
  resumen_ejecutivo: string;
  evaluacion_riesgo_control_interno: string;
  puntos_criticos_auditoria: Array<{
    titulo: string;
    impacto_financiero: string;
    recomendacion_inmediata: string;
  }>;
  asientos_contables_requeridos: Array<{
    descripcion: string;
    cuentas: string;
  }>;
  politica_control_sugerida: string;
}

export interface EmailDispatchResult {
  success: boolean;
  mode: "live_smtp" | "simulated_delivery";
  messageId?: string;
  message?: string;
  recipient: string;
  subject: string;
  previewHtml?: string;
  deliveredAt: string;
}
