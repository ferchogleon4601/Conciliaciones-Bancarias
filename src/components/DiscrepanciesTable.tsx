import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DiscrepancyItem, JournalEntry, ReconciliationParameters } from "../types";
import { exportDiscrepanciesToExcel, exportDiscrepanciesToCSV } from "../utils/fileParsers";

interface DiscrepanciesTableProps {
  discrepancies: DiscrepancyItem[];
  suggestedAdjustments: JournalEntry[];
  parameters: ReconciliationParameters;
}

export const DiscrepanciesTable: React.FC<DiscrepanciesTableProps> = ({
  discrepancies,
  suggestedAdjustments,
  parameters,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtered list
  const filtered = discrepancies.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.probable_cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ledger_item?.reference || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.bank_item?.reference || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = selectedRisk === "ALL" || item.risk_level === selectedRisk;
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;

    return matchesSearch && matchesRisk && matchesCategory;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "ALTA":
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Riesgo Alto</span>;
      case "MEDIA":
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Riesgo Medio</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Riesgo Bajo</span>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "DIFERENCIA_DE_IMPORTE":
        return "Diferencia de Monto / Digitación";
      case "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO":
        return "Cheque / Egreso en Tránsito";
      case "DEPOSITO_EN_TRANSITO":
        return "Depósito / Abono en Tránsito";
      case "NOTA_DEBITO_BANCARIA_NO_REGISTRADA":
        return "Nota Débito Bancaria (Gasto)";
      case "NOTA_CREDITO_BANCARIA_NO_REGISTRADA":
        return "Nota Crédito Bancaria (Ingreso)";
      case "CARGO_BANCARIO_NO_IDENTIFICADO":
        return "Cargo No Identificado";
      default:
        return category;
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
            Paso 4 • Matriz de Discrepancias & Auditoría
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Reporte Automatizado de Discrepancias & Hallazgos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detalle de partidas pendientes, errores de digitación, gastos bancarios no contabilizados y ajustes contables requeridos.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-discrepancies-excel"
            onClick={() => exportDiscrepanciesToExcel(discrepancies, parameters.company_name)}
            disabled={discrepancies.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-all shadow-xs disabled:opacity-40"
            title="Descargar cédula de discrepancias en formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            id="btn-export-discrepancies-csv"
            onClick={() => exportDiscrepanciesToCSV(discrepancies, parameters.company_name)}
            disabled={discrepancies.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-xs disabled:opacity-40"
            title="Descargar datos en CSV"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por referencia, concepto o causa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Risk Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Todos los Riesgos</option>
              <option value="ALTA">Riesgo Alto</option>
              <option value="MEDIA">Riesgo Medio</option>
              <option value="BAJA">Riesgo Bajo</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 max-w-[180px] truncate"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="DIFERENCIA_DE_IMPORTE">Diferencia de Monto</option>
            <option value="CHEQUE_O_TRANSFERENCIA_EN_TRANSITO">Cheques en Tránsito</option>
            <option value="DEPOSITO_EN_TRANSITO">Depósitos en Tránsito</option>
            <option value="NOTA_DEBITO_BANCARIA_NO_REGISTRADA">Notas Débito (Gastos)</option>
            <option value="NOTA_CREDITO_BANCARIA_NO_REGISTRADA">Notas Crédito (Abonos)</option>
          </select>
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">ID / Clasificación</th>
                <th className="py-3 px-3.5">Descripción del Hallazgo</th>
                <th className="py-3 px-3.5 text-right">Libro Auxiliar</th>
                <th className="py-3 px-3.5 text-right">Extracto Banco</th>
                <th className="py-3 px-3.5 text-right">Variación Neta</th>
                <th className="py-3 px-3.5 text-center">Nivel de Riesgo</th>
                <th className="py-3 px-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron discrepancias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? "bg-indigo-50/40" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-800">{item.id}</div>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate" title={item.probable_cause}>
                            Causa: {item.probable_cause}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-700">
                          {item.ledger_amount !== 0 ? `$${item.ledger_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-700">
                          {item.bank_amount !== 0 ? `$${item.bank_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold">
                          <span className={item.variance > 0 ? "text-emerald-700" : "text-rose-600"}>
                            {item.variance > 0 ? "+" : ""}
                            ${item.variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {getRiskBadge(item.risk_level)}
                        </td>
                        <td className="py-3 px-3.5 text-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/20 border-b border-indigo-100">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl border border-indigo-200/60 p-4 shadow-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-2">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Impacto en Auditoría & Control Interno
                                  </h4>
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    {item.audit_impact}
                                  </p>
                                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                    <span className="font-semibold text-slate-700 block">Causa Determinada por el Motor:</span>
                                    <span className="text-slate-600">{item.probable_cause}</span>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Plan de Remediación y Ajuste Contable
                                  </h4>
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    {item.remediation}
                                  </p>

                                  {/* Movement reference tags */}
                                  <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
                                    {item.ledger_item && (
                                      <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        Libro Ref: {item.ledger_item.reference} ({item.ledger_item.date})
                                      </span>
                                    )}
                                    {item.bank_item && (
                                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                        Banco Ref: {item.bank_item.reference} ({item.bank_item.date})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested Journal Entries Section */}
      {suggestedAdjustments && suggestedAdjustments.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Asientos Contables de Ajuste Recomendados para Cierre
              </h3>
              <p className="text-xs text-slate-500">
                Propuestas de regularización contable para conciliar los saldos de libros con el extracto bancario.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedAdjustments.map((asiento, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-mono font-bold text-xs text-indigo-700">
                      {asiento.asiento_num}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800">
                      ${asiento.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-2 line-clamp-2">
                    {asiento.concepto}
                  </p>

                  {/* Debit / Credit lines */}
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    {asiento.entries.map((ent, eIdx) => (
                      <div
                        key={eIdx}
                        className="flex items-center justify-between py-1 px-2 rounded bg-white border border-slate-100"
                      >
                        <span className="text-slate-600 truncate max-w-[170px]" title={ent.cuenta}>
                          {ent.cuenta}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              ent.tipo === "DEBE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {ent.tipo}
                          </span>
                          <span className="font-mono font-medium text-slate-800">
                            ${ent.monto.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
