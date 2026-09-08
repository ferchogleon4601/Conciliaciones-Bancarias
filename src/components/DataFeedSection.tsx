import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Table,
  Play,
  Loader2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Cpu,
} from "lucide-react";
import { LedgerTransaction, BankTransaction, ReconciliationParameters } from "../types";
import {
  parseExcelFile,
  parseCSVFile,
  mapToLedgerTransactions,
  mapToBankTransactions,
} from "../utils/fileParsers";

interface DataFeedSectionProps {
  ledgerData: LedgerTransaction[];
  bankData: BankTransaction[];
  parameters: ReconciliationParameters;
  onUpdateLedger: (data: LedgerTransaction[]) => void;
  onUpdateBank: (data: BankTransaction[]) => void;
  onExecuteReconciliation: () => void;
  isProcessing: boolean;
  hasReconciled: boolean;
}

export const DataFeedSection: React.FC<DataFeedSectionProps> = ({
  ledgerData,
  bankData,
  parameters,
  onUpdateLedger,
  onUpdateBank,
  onExecuteReconciliation,
  isProcessing,
  hasReconciled,
}) => {
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [isParsingPDF, setIsParsingPDF] = useState(false);
  const [showLedgerTable, setShowLedgerTable] = useState(false);
  const [showBankTable, setShowBankTable] = useState(false);

  const ledgerInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);

  // Totals
  const ledgerDebits = ledgerData.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const ledgerCredits = ledgerData.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  const ledgerNet = parameters.initial_ledger_balance + (ledgerDebits - ledgerCredits);

  const bankInflows = bankData.reduce((acc, curr) => acc + (curr.inflow || 0), 0);
  const bankOutflows = bankData.reduce((acc, curr) => acc + (curr.outflow || 0), 0);
  const bankNet = parameters.initial_bank_balance + (bankInflows - bankOutflows);

  // Handle Ledger file
  const handleLedgerFile = async (file: File) => {
    setLedgerError(null);
    try {
      let rawRows: any[] = [];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "xlsx" || extension === "xls") {
        rawRows = await parseExcelFile(file);
      } else if (extension === "csv") {
        rawRows = await parseCSVFile(file);
      } else {
        throw new Error("Formato no soportado. Cargue un archivo Excel (.xlsx, .xls) o CSV.");
      }

      if (!rawRows || rawRows.length === 0) {
        throw new Error("El archivo no contiene filas legibles.");
      }

      const mapped = mapToLedgerTransactions(rawRows);
      onUpdateLedger(mapped);
    } catch (err: any) {
      setLedgerError(err.message || "Error al procesar el archivo del Libro Auxiliar.");
    }
  };

  // Handle Bank file
  const handleBankFile = async (file: File) => {
    setBankError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "csv") {
        const rawRows = await parseCSVFile(file);
        const mapped = mapToBankTransactions(rawRows);
        onUpdateBank(mapped);
      } else if (extension === "pdf") {
        setIsParsingPDF(true);
        // Convert to base64 and send to /api/parse-pdf
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(",")[1];
            const resp = await fetch("/api/parse-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64Data }),
            });
            const result = await resp.json();
            if (result.transactions && result.transactions.length > 0) {
              onUpdateBank(result.transactions);
            } else {
              throw new Error("No se detectaron transacciones bancarias legibles en el PDF. Intente con formato CSV o verifique que no sea imagen escaneada.");
            }
          } catch (pdfErr: any) {
            setBankError(pdfErr.message || "Error procesando PDF bancario.");
          } finally {
            setIsParsingPDF(false);
          }
        };
        reader.readAsDataURL(file);
      } else if (extension === "xlsx" || extension === "xls") {
        const rawRows = await parseExcelFile(file);
        const mapped = mapToBankTransactions(rawRows);
        onUpdateBank(mapped);
      } else {
        throw new Error("Formato no soportado. Cargue un extracto en PDF (.pdf) o CSV (.csv).");
      }
    } catch (err: any) {
      setBankError(err.message || "Error al procesar el extracto bancario.");
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Paso 1 • Alimentación de Fuentes de Datos
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-2">
            Cruce de Libros Auxiliares Contables vs. Extractos Bancarios
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cargue los movimientos contables en Excel y compare contra extractos en formato PDF o CSV para la conciliación automática.
          </p>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Registros Totales
            </span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {ledgerData.length} Contables / {bankData.length} Banco
            </span>
          </div>
          <div className={`w-3 h-3 rounded-full ${ledgerData.length > 0 && bankData.length > 0 ? "bg-emerald-500" : "bg-amber-400"}`} />
        </div>
      </div>

      {/* Dual Upload Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* PANEL 1: LIBRO AUXILIAR CONTABLE (EXCEL / CSV) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Libro Auxiliar Contable (Excel)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Formatos compatibles: .xlsx, .xls, .csv
                </p>
              </div>
            </div>

            {ledgerData.length > 0 && (
              <button
                onClick={() => onUpdateLedger([])}
                className="text-slate-400 hover:text-rose-500 text-xs p-1"
                title="Limpiar datos del libro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => ledgerInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleLedgerFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-sm group"
          >
            <input
              ref={ledgerInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleLedgerFile(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mx-auto mb-1.5 transition-colors" />
            <p className="text-xs font-semibold text-slate-700">
              Arrastre aquí su archivo Excel o <span className="text-indigo-600 underline">explore</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Columnas detectadas: Fecha, Comprobante/Ref, Concepto, Debe, Haber
            </p>
          </div>

          {ledgerError && (
            <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{ledgerError}</span>
            </div>
          )}

          {/* Ledger Stats Summary */}
          {ledgerData.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="border-r border-slate-100 pr-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Movimientos</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{ledgerData.length}</span>
                </div>
                <div className="border-r border-slate-100 pr-1">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Total Débitos (Debe)</span>
                  <span className="font-bold text-emerald-700 font-mono text-xs">+${ledgerDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-rose-600 block">Total Créditos (Haber)</span>
                  <span className="font-bold text-rose-700 font-mono text-xs">-${ledgerCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Saldo Contable Estimado:</span>
                <span className="font-bold font-mono text-indigo-700 text-sm">
                  ${ledgerNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Toggle Table Preview */}
              <button
                onClick={() => setShowLedgerTable(!showLedgerTable)}
                className="mt-2 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 mx-auto transition-colors"
              >
                {showLedgerTable ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showLedgerTable ? "Ocultar previsualización" : "Ver primeras 5 filas cargadas"}</span>
              </button>

              {showLedgerTable && (
                <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-1.5">Fecha</th>
                        <th className="p-1.5">Ref</th>
                        <th className="p-1.5">Concepto</th>
                        <th className="p-1.5 text-right">Debe</th>
                        <th className="p-1.5 text-right">Haber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-1.5 font-mono text-slate-500">{row.date}</td>
                          <td className="p-1.5 font-mono font-medium text-slate-700">{row.reference}</td>
                          <td className="p-1.5 truncate max-w-[120px] text-slate-600">{row.description}</td>
                          <td className="p-1.5 text-right font-mono text-emerald-600">{row.debit ? `$${row.debit.toLocaleString()}` : "-"}</td>
                          <td className="p-1.5 text-right font-mono text-rose-600">{row.credit ? `$${row.credit.toLocaleString()}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL 2: EXTRACTO BANCARIO (PDF / CSV) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Extracto Bancario (PDF o CSV)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Formatos compatibles: .pdf (texto bancario) o .csv
                </p>
              </div>
            </div>

            {bankData.length > 0 && (
              <button
                onClick={() => onUpdateBank([])}
                className="text-slate-400 hover:text-rose-500 text-xs p-1"
                title="Limpiar datos bancarios"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => bankInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleBankFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-sm group relative"
          >
            <input
              ref={bankInputRef}
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleBankFile(e.target.files[0]);
                }
              }}
            />
            {isParsingPDF ? (
              <div className="py-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-blue-700">Analizando extracto PDF...</p>
                <p className="text-[10px] text-slate-400">Extrayendo movimientos y saldos bancarios</p>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mx-auto mb-1.5 transition-colors" />
                <p className="text-xs font-semibold text-slate-700">
                  Arrastre aquí su extracto bancario en PDF o CSV o <span className="text-blue-600 underline">explore</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Extracción automática de: Fecha, Referencia, Abonos (+), Cargos (-)
                </p>
              </>
            )}
          </div>

          {bankError && (
            <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{bankError}</span>
            </div>
          )}

          {/* Bank Stats Summary */}
          {bankData.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="border-r border-slate-100 pr-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Movimientos</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{bankData.length}</span>
                </div>
                <div className="border-r border-slate-100 pr-1">
                  <span className="text-[10px] uppercase font-semibold text-blue-600 block">Total Abonos (+)</span>
                  <span className="font-bold text-blue-700 font-mono text-xs">+${bankInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-orange-600 block">Total Cargos (-)</span>
                  <span className="font-bold text-orange-700 font-mono text-xs">-${bankOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Saldo Banco Calculado:</span>
                <span className="font-bold font-mono text-blue-700 text-sm">
                  ${bankNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Toggle Table Preview */}
              <button
                onClick={() => setShowBankTable(!showBankTable)}
                className="mt-2 text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 mx-auto transition-colors"
              >
                {showBankTable ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showBankTable ? "Ocultar previsualización" : "Ver primeras 5 filas cargadas"}</span>
              </button>

              {showBankTable && (
                <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-1.5">Fecha</th>
                        <th className="p-1.5">Ref</th>
                        <th className="p-1.5">Concepto</th>
                        <th className="p-1.5 text-right">Abonos</th>
                        <th className="p-1.5 text-right">Cargos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bankData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-1.5 font-mono text-slate-500">{row.date}</td>
                          <td className="p-1.5 font-mono font-medium text-slate-700">{row.reference}</td>
                          <td className="p-1.5 truncate max-w-[120px] text-slate-600">{row.description}</td>
                          <td className="p-1.5 text-right font-mono text-blue-600">{row.inflow ? `$${row.inflow.toLocaleString()}` : "-"}</td>
                          <td className="p-1.5 text-right font-mono text-orange-600">{row.outflow ? `$${row.outflow.toLocaleString()}` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Execution Call to Action */}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Automatización de Cruce de Saldos
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Python Engine
              </span>
            </h4>
            <p className="text-xs text-slate-300">
              {ledgerData.length > 0 && bankData.length > 0
                ? `Listo para procesar: ${ledgerData.length} registros contables y ${bankData.length} movimientos bancarios.`
                : "Cargue ambos archivos o pulse 'Cargar Caso Demo' para iniciar la conciliación."}
            </p>
          </div>
        </div>

        <button
          id="btn-execute-reconciliation"
          onClick={onExecuteReconciliation}
          disabled={isProcessing || ledgerData.length === 0 || bankData.length === 0}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Ejecutando Cruce en Python...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{hasReconciled ? "Re-ejecutar Conciliación" : "Conciliar Saldos con Python"}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
