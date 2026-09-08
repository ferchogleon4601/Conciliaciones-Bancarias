import React from "react";
import { X, Printer, CheckCircle, Scale, ShieldCheck } from "lucide-react";
import { ReconciliationResult, ReconciliationParameters } from "../types";

interface AuditReportPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReconciliationResult;
  parameters: ReconciliationParameters;
}

export const AuditReportPrintView: React.FC<AuditReportPrintViewProps> = ({
  isOpen,
  onClose,
  result,
  parameters,
}) => {
  if (!isOpen) return null;

  const { summary, discrepancies, suggested_adjustments } = result;
  const isPerfectMatch = summary.cuadre_gap < 0.01;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold">Papel de Trabajo: Cédula Sumaria de Conciliación Bancaria</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="p-8 overflow-y-auto flex-1 bg-white font-sans text-slate-800 space-y-6 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                PAPELES DE TRABAJO • AUDITORÍA DE EFECTIVO Y EQUIVALENTES (NIA 505)
              </span>
              <h1 className="text-xl font-black text-slate-900 uppercase">
                {parameters.company_name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Entidad Financiera:</strong> {parameters.bank_name} &nbsp;|&nbsp;
                <strong>Cuenta:</strong> {parameters.account_number} &nbsp;|&nbsp;
                <strong>Período:</strong> {parameters.period_label}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-900">
                REF: CED-BAN-01
              </div>
              <div className="text-[10px] text-slate-500">
                Fecha Emisión: {new Date().toLocaleDateString("es-ES")}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300 font-mono">
                {parameters.currency}
              </span>
            </div>
          </div>

          {/* Cédula Sumaria Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              1. Cédula Sumaria de Conciliación Bancaria
            </h2>
            <table className="w-full text-xs border border-slate-300">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2">Saldo según Libro Auxiliar al Cierre Contable</td>
                  <td className="p-2 text-right font-mono">${summary.final_ledger_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-6 text-slate-700">(+) Cheques girados y no presentados al cobro en banco</td>
                  <td className="p-2 text-right font-mono text-slate-700">+${summary.cheques_transito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-6 text-slate-700">(-) Depósitos y remesas en tránsito</td>
                  <td className="p-2 text-right font-mono text-slate-700">-${summary.depositos_transito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-6 text-slate-700">(+) Notas de Crédito bancarias no registradas en libros</td>
                  <td className="p-2 text-right font-mono text-slate-700">+${summary.notas_credito_banco.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-2 pl-6 text-slate-700">(-) Notas de Débito bancarias no registradas en libros</td>
                  <td className="p-2 text-right font-mono text-slate-700">-${summary.notas_debito_banco.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                {summary.diferencias_monto_netas !== 0 && (
                  <tr>
                    <td className="p-2 pl-6 text-slate-700">(+/-) Ajustes por diferencias en importes / digitación</td>
                    <td className="p-2 text-right font-mono text-slate-700">${summary.diferencias_monto_netas.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td className="p-2">(=) Saldo Conciliado Ajustado</td>
                  <td className="p-2 text-right font-mono">${summary.saldo_libros_ajustado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-2">Saldo según Extracto Bancario Oficial al Corte</td>
                  <td className="p-2 text-right font-mono">${summary.final_bank_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className={`font-black ${isPerfectMatch ? "bg-emerald-50 text-emerald-950" : "bg-rose-50 text-rose-950"}`}>
                  <td className="p-2 uppercase">Diferencia de Cuadre Residual (Gap de Auditoría)</td>
                  <td className="p-2 text-right font-mono text-sm">${summary.cuadre_gap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Discrepancies Matrix */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              2. Matriz de Partidas Conciliatorias & Discrepancias ({discrepancies.length})
            </h2>
            <table className="w-full text-[11px] border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 text-left">Ref / Hallazgo</th>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-right">Monto Libro</th>
                  <th className="p-2 text-right">Monto Banco</th>
                  <th className="p-2 text-right">Variación</th>
                  <th className="p-2 text-left">Causa & Remediación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td className="p-2 font-mono font-bold">{d.id}</td>
                    <td className="p-2 font-medium">{d.title}</td>
                    <td className="p-2 text-right font-mono">${d.ledger_amount.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">${d.bank_amount.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold">${d.variance.toLocaleString()}</td>
                    <td className="p-2 text-slate-600">{d.remediation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">
                Senior Data Analyst
              </div>
              <span className="text-[10px] text-slate-500">Preparado / Conciliación Automatizada</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">
                Contador General
              </div>
              <span className="text-[10px] text-slate-500">Revisado / Registro Contable</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">
                Revisor Fiscal / Auditor
              </div>
              <span className="text-[10px] text-slate-500">Dictamen & Aprobación Final</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
