import React from "react";
import {
  FileSpreadsheet,
  Mail,
  Printer,
  Sparkles,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { ReconciliationParameters, ReconciliationResult } from "../types";

interface HeaderProps {
  parameters: ReconciliationParameters;
  onOpenSettings: () => void;
  onOpenEmail: () => void;
  onPrintReport: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  onOpenVercel?: () => void;
  reconciliationResult: ReconciliationResult | null;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  parameters,
  onOpenSettings,
  onOpenEmail,
  onPrintReport,
  onLoadSample,
  onReset,
  onOpenVercel,
  reconciliationResult,
  isProcessing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Senior Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                ConciliaData <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30">PRO</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <Cpu className="w-3 h-3" />
                Motor Dual (Python + TS Vercel)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistema Senior de Conciliación Bancaria & Auditoría Contable Automatizada
            </p>
          </div>
        </div>

        {/* Company and Period Sub-label */}
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-200">
            {parameters.company_name}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {parameters.bank_name} • {parameters.account_number}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Vercel Deploy Guide Button */}
          {onOpenVercel && (
            <button
              id="btn-open-vercel-guide"
              onClick={onOpenVercel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black hover:bg-slate-800 text-white transition-all shadow-sm border border-slate-700 active:scale-95"
              title="Guía y configuración de despliegue a Vercel"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <span>Subir a Vercel</span>
            </button>
          )}

          {/* Load Demo Case */}
          <button
            id="btn-load-sample"
            onClick={onLoadSample}
            disabled={isProcessing}
            title="Cargar caso contable real con Libro Auxiliar y Extracto Bancario de muestra"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm shadow-indigo-600/30 border border-indigo-400/30 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Cargar Caso Demo</span>
          </button>

          {/* Email Notification Button */}
          <button
            id="btn-open-email-modal"
            onClick={onOpenEmail}
            disabled={!reconciliationResult}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              reconciliationResult
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 active:scale-95"
                : "bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed"
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Notificar por</span> Correo
            {reconciliationResult && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          {/* Print / Export Report */}
          <button
            id="btn-print-audit-report"
            onClick={onPrintReport}
            disabled={!reconciliationResult}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              reconciliationResult
                ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 active:scale-95"
                : "bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed"
            }`}
            title="Imprimir o guardar cédula sumaria de auditoría"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Imprimir Cédula</span>
          </button>

          {/* Settings Modal */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Configurar tolerancias y saldos iniciales"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            id="btn-reset-data"
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Reiniciar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
