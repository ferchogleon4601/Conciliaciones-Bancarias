/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DataFeedSection } from "./components/DataFeedSection";
import { ReconciliationSummary } from "./components/ReconciliationSummary";
import { ComparativeCharts } from "./components/ComparativeCharts";
import { DiscrepanciesTable } from "./components/DiscrepanciesTable";
import { AIAuditOpinion } from "./components/AIAuditOpinion";
import { EmailNotificationModal } from "./components/EmailNotificationModal";
import { ParametersModal } from "./components/ParametersModal";
import { AuditReportPrintView } from "./components/AuditReportPrintView";
import {
  DEFAULT_PARAMETERS,
  SAMPLE_LEDGER_DATA,
  SAMPLE_BANK_DATA,
} from "./data/mockData";
import {
  LedgerTransaction,
  BankTransaction,
  ReconciliationParameters,
  ReconciliationResult,
} from "./types";
import {
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  BarChart3,
  Scale,
  Sparkles,
  Mail,
  HelpCircle,
} from "lucide-react";

export default function App() {
  const [parameters, setParameters] = useState<ReconciliationParameters>(DEFAULT_PARAMETERS);
  const [ledgerData, setLedgerData] = useState<LedgerTransaction[]>(SAMPLE_LEDGER_DATA);
  const [bankData, setBankData] = useState<BankTransaction[]>(SAMPLE_BANK_DATA);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Show toast notification
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Execute reconciliation via backend Python Engine
  const executeReconciliation = async (
    customLedger?: LedgerTransaction[],
    customBank?: BankTransaction[],
    customParams?: ReconciliationParameters
  ) => {
    const lData = customLedger || ledgerData;
    const bData = customBank || bankData;
    const pData = customParams || parameters;

    if (lData.length === 0 || bData.length === 0) {
      showToast("Debe alimentar tanto el Libro Auxiliar como el Extracto Bancario.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerTransactions: lData,
          bankTransactions: bData,
          parameters: pData,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || "Error al procesar conciliación con Python.");
      }

      const result: ReconciliationResult = await response.json();
      setReconciliationResult(result);
      showToast(
        `Conciliación completada: ${result.summary.matched_count} partidas cruzadas, ${result.summary.discrepancies_count} discrepancias.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error al conectar con el motor Python.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Run on initial load with demo data
  useEffect(() => {
    executeReconciliation(SAMPLE_LEDGER_DATA, SAMPLE_BANK_DATA, DEFAULT_PARAMETERS);
  }, []);

  // Handler for loading demo scenario
  const handleLoadSample = () => {
    setLedgerData(SAMPLE_LEDGER_DATA);
    setBankData(SAMPLE_BANK_DATA);
    setParameters(DEFAULT_PARAMETERS);
    executeReconciliation(SAMPLE_LEDGER_DATA, SAMPLE_BANK_DATA, DEFAULT_PARAMETERS);
  };

  // Handler for resetting data
  const handleReset = () => {
    setLedgerData([]);
    setBankData([]);
    setReconciliationResult(null);
    showToast("Datos reiniciados. Puede cargar sus propios archivos Excel y PDF.", "success");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-slate-900 text-white border-slate-700"
                : "bg-rose-900 text-white border-rose-700"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        parameters={parameters}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenEmail={() => setIsEmailModalOpen(true)}
        onPrintReport={() => setIsPrintReportOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        reconciliationResult={reconciliationResult}
        isProcessing={isProcessing}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step 1: Data Feeding (Libro Auxiliar Excel & Extracto Bancario PDF / CSV) */}
        <DataFeedSection
          ledgerData={ledgerData}
          bankData={bankData}
          parameters={parameters}
          onUpdateLedger={setLedgerData}
          onUpdateBank={setBankData}
          onExecuteReconciliation={() => executeReconciliation()}
          isProcessing={isProcessing}
          hasReconciled={!!reconciliationResult}
        />

        {/* Step 2: Formal Accounting Reconciliation Schedule (Cédula Sumaria) */}
        {reconciliationResult && (
          <>
            <ReconciliationSummary
              result={reconciliationResult}
              parameters={parameters}
            />

            {/* Step 3: Comparative Visual Charts */}
            <ComparativeCharts
              result={reconciliationResult}
              parameters={parameters}
            />

            {/* Step 4: Discrepancies Audit Log & Suggested Journal Entries */}
            <DiscrepanciesTable
              discrepancies={reconciliationResult.discrepancies}
              suggestedAdjustments={reconciliationResult.suggested_adjustments}
              parameters={parameters}
            />

            {/* Step 5: Senior Auditor AI Opinion & COSO Control Assessment */}
            <AIAuditOpinion
              result={reconciliationResult}
              parameters={parameters}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>ConciliaData PRO</strong> • Sistema Automatizado de Conciliación Bancaria & Auditoría Contable
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Motor de conciliación: Python 3.10 • Análisis de auditoría: Gemini 3.8 Flash
          </span>
        </div>
      </footer>

      {/* Modals */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        result={reconciliationResult || ({} as ReconciliationResult)}
        parameters={parameters}
      />

      <ParametersModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        parameters={parameters}
        onSave={(newParams) => {
          setParameters(newParams);
          showToast("Parámetros actualizados.", "success");
          if (ledgerData.length > 0 && bankData.length > 0) {
            executeReconciliation(ledgerData, bankData, newParams);
          }
        }}
      />

      {reconciliationResult && (
        <AuditReportPrintView
          isOpen={isPrintReportOpen}
          onClose={() => setIsPrintReportOpen(false)}
          result={reconciliationResult}
          parameters={parameters}
        />
      )}
    </div>
  );
}

