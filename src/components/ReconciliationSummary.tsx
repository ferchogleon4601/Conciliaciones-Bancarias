import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingUp,
  Percent,
  FileCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ReconciliationResult, ReconciliationParameters } from "../types";

interface ReconciliationSummaryProps {
  result: ReconciliationResult;
  parameters: ReconciliationParameters;
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  result,
  parameters,
}) => {
  const { summary } = result;
  const isPerfectMatch = summary.cuadre_gap < 0.01;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            Paso 2 • Cédula Sumaria & Dictamen de Cuadre
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            Cédula Sumaria de Conciliación Bancaria
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo matemático de partidas conciliatorias conforme a principios contables y Normas Internacionales de Auditoría (NIA).
          </p>
        </div>

        {/* Verdict Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
            isPerfectMatch
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {isPerfectMatch ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>CUADRE CONCILIATORIO PERFECTO (GAP $0.00)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>DESCUADRE RESIDUAL: ${summary.cuadre_gap.toLocaleString()}</span>
            </>
          )}
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Metric 1: Reconciliation Rate */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tasa de Cruce Automático</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {summary.reconciliation_rate_pct}%
            </span>
            <span className="text-xs text-slate-400 font-medium">de movimientos</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, summary.reconciliation_rate_pct)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Matched Pairs */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Partidas Conciliadas</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700 font-mono">
              {summary.matched_count}
            </span>
            <span className="text-xs text-slate-400 font-medium">coincidencias plenas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Tolerancia aplicada: {parameters.date_tolerance_days} días
          </p>
        </div>

        {/* Metric 3: Discrepancies Count */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Partidas Conciliatorias</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-800 font-mono">
              {summary.discrepancies_count}
            </span>
            <span className="text-xs text-slate-400 font-medium">para auditoría</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
              {summary.risk_distribution.alta} Alta
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
              {summary.risk_distribution.media} Media
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
              {summary.risk_distribution.baja} Baja
            </span>
          </div>
        </div>

        {/* Metric 4: Cuadre Residual */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Descuadre Residual</span>
            <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold font-mono ${
                isPerfectMatch ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              ${summary.cuadre_gap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {isPerfectMatch
              ? "Identificadas 100% de diferencias"
              : "Requiere investigación adicional"}
          </p>
        </div>
      </div>

      {/* The Master Accounting Reconciliation Schedule (Cédula de Trabajo) */}
      <div className="mt-7 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300 block">
              Cédula de Trabajo • Auditoría Bancaria
            </span>
            <span className="text-slate-400 font-mono">
              {parameters.company_name} | Período: {parameters.period_label}
            </span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
            Moneda: {parameters.currency}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {/* Saldo según Libro Auxiliar */}
              <tr className="bg-slate-50/70 font-semibold text-slate-800">
                <td className="py-3 px-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Saldo según Libro Auxiliar al Cierre</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-indigo-700 font-bold">
                  ${summary.final_ledger_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* (+) Cheques girados y no cobrados */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 pl-8 text-slate-600 flex items-center justify-between">
                  <span>(+) Cheques girados y no cobrados (en tránsito)</span>
                  <span className="text-[11px] text-slate-400 font-mono">Partida en libros pendiente de debitar en banco</span>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-medium">
                  +${summary.cheques_transito.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* (-) Depósitos en tránsito */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 pl-8 text-slate-600 flex items-center justify-between">
                  <span>(-) Depósitos y remesas en tránsito (no acreditados)</span>
                  <span className="text-[11px] text-slate-400 font-mono">Partida en libros pendiente de abonar en banco</span>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                  -${summary.depositos_transito.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* (+) Notas de Crédito Bancarias */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 pl-8 text-slate-600 flex items-center justify-between">
                  <span>(+) Notas de Crédito bancarias no registradas en libros</span>
                  <span className="text-[11px] text-slate-400 font-mono">Rendimientos financieros y transferencias por identificar</span>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-medium">
                  +${summary.notas_credito_banco.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* (-) Notas de Débito Bancarias */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-2.5 px-4 pl-8 text-slate-600 flex items-center justify-between">
                  <span>(-) Notas de Débito bancarias no registradas en libros</span>
                  <span className="text-[11px] text-slate-400 font-mono">Comisiones bancarias, cuota de manejo, gravamen 4x1000</span>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                  -${summary.notas_debito_banco.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Net Amount Discrepancies */}
              {summary.diferencias_monto_netas !== 0 && (
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 pl-8 text-slate-600 flex items-center justify-between">
                    <span>(+/-) Corrección neta por diferencias de importe / digitación</span>
                    <span className="text-[11px] text-slate-400 font-mono">Errores de transposición y redondeo documental</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-700 font-medium">
                    {summary.diferencias_monto_netas > 0 ? "+" : ""}
                    ${summary.diferencias_monto_netas.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {/* Saldo Conciliado según Libros */}
              <tr className="bg-indigo-50/60 font-bold text-indigo-950 border-t-2 border-indigo-200">
                <td className="py-3 px-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>(=) Saldo Conciliado Ajustado</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-indigo-900 text-base">
                  ${summary.saldo_libros_ajustado.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Saldo según Extracto Bancario */}
              <tr className="bg-blue-50/60 font-bold text-blue-950">
                <td className="py-3 px-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Saldo según Extracto Bancario al Corte</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-900 text-base">
                  ${summary.final_bank_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Cuadre Residual */}
              <tr className={`font-extrabold ${isPerfectMatch ? "bg-emerald-100/50 text-emerald-950" : "bg-rose-100 text-rose-950"}`}>
                <td className="py-3.5 px-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    DIFERENCIA RESIDUAL DE AUDITORÍA (GAP)
                  </span>
                  <span className="text-xs font-normal opacity-75">
                    {isPerfectMatch ? "Cédula cuadrada satisfactoriamente" : "Requiere ajuste manual contable"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-lg">
                  ${summary.cuadre_gap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Senior Analyst Narrative Bar */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs leading-relaxed border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          DICTAMEN DEL ANALISTA DE DATOS SENIOR:
        </div>
        <p className="text-slate-300 font-sans">
          {result.executive_narrative}
        </p>
      </div>
    </section>
  );
};
