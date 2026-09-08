import React, { useState } from "react";
import {
  Mail,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Code,
  Building,
  ShieldCheck,
} from "lucide-react";
import { ReconciliationResult, ReconciliationParameters, EmailDispatchResult } from "../types";

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReconciliationResult;
  parameters: ReconciliationParameters;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  result,
  parameters,
}) => {
  const [recipient, setRecipient] = useState("ferchogleon@gmail.com");
  const [subject, setSubject] = useState(
    `[Auditoría Contable] Conciliación Bancaria ${parameters.company_name} - ${parameters.period_label}`
  );
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const { summary, discrepancies } = result;
  const isPerfectMatch = summary.cuadre_gap < 0.01;

  const handleSendEmail = async () => {
    setIsSending(true);
    setError(null);
    try {
      const resp = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          subject,
          summary,
          discrepancies,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Error al despachar el correo");
      }

      const data = await resp.json();
      setDispatchResult(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el despachador de correo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Notificación Formal por Correo Electrónico
              </h3>
              <p className="text-xs text-slate-400">
                Despacho de reporte y cédula de discrepancias para la junta o auditoría contable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {dispatchResult ? (
            <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-emerald-950">
                ¡Notificación Despachada con Éxito!
              </h4>
              <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                {dispatchResult.message || "El reporte de conciliación bancaria y la matriz de discrepancias fueron transmitidos exitosamente."}
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200 text-left font-mono text-[11px] text-slate-600 max-w-md mx-auto space-y-1">
                <div><strong>Destinatario:</strong> {dispatchResult.recipient}</div>
                <div><strong>Asunto:</strong> {dispatchResult.subject}</div>
                <div><strong>Fecha de Entrega:</strong> {dispatchResult.deliveredAt}</div>
                <div><strong>Modo:</strong> {dispatchResult.mode}</div>
              </div>
              <button
                onClick={() => setDispatchResult(null)}
                className="mt-5 px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-600 transition-colors"
              >
                Enviar a Otro Destinatario
              </button>
            </div>
          ) : (
            <>
              {/* Recipient & Subject Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Correo Destinatario (Auditor / Gerencia):
                  </label>
                  <input
                    type="email"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="auditor@empresa.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Línea de Asunto:
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-xs"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tabs: Preview vs Code */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    Previsualización del Correo de Auditoría
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[10px] ${
                        activeTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Diseño HTML
                    </button>
                    <button
                      onClick={() => setActiveTab("code")}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[10px] ${
                        activeTab === "code" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Fuente HTML
                    </button>
                  </div>
                </div>

                {activeTab === "preview" ? (
                  <div className="p-4 bg-slate-50 max-h-72 overflow-y-auto">
                    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden font-sans">
                      {/* Email Header */}
                      <div className="bg-slate-900 p-4 text-white text-center">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                          CONCILIADATA PRO • INFORME DE AUDITORÍA
                        </span>
                        <h4 className="text-sm font-bold mt-1">
                          Dictamen de Conciliación Bancaria
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {parameters.company_name} | {parameters.period_label}
                        </p>
                      </div>

                      {/* Email Body */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-600">Saldo Final según Libro Auxiliar:</span>
                          <span className="font-bold font-mono text-indigo-700">
                            ${summary.final_ledger_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-600">Saldo Final según Extracto Bancario:</span>
                          <span className="font-bold font-mono text-blue-700">
                            ${summary.final_bank_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-slate-600">Tasa de Cruce Automático:</span>
                          <span className="font-bold text-slate-900">
                            {summary.reconciliation_rate_pct}% ({summary.matched_count} ítems conciliados)
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="font-bold text-slate-800">Descuadre Residual de Cédula:</span>
                          <span
                            className={`font-bold font-mono text-sm ${
                              isPerfectMatch ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            ${summary.cuadre_gap.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Top Discrepancies Table in Email */}
                        <div className="mt-3 pt-2">
                          <span className="font-bold text-slate-800 block mb-1">
                            Discrepancias Materiales Reportadas ({discrepancies.length}):
                          </span>
                          <ul className="space-y-1.5 pl-2 text-[11px] text-slate-600">
                            {discrepancies.slice(0, 4).map((d, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span>
                                  <strong>[{d.risk_level}] {d.title}:</strong> {d.remediation} (Impacto: ${d.abs_variance.toLocaleString()})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Email Footer */}
                      <div className="p-3 bg-slate-100 text-center text-[10px] text-slate-500 border-t border-slate-200">
                        Informe transmitido por el sistema automatizado de conciliaciones bancarias.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{`<!DOCTYPE html>
<html>
  <body>
    <h2>Conciliación Bancaria - ${parameters.company_name}</h2>
    <p>Saldo Libros: $${summary.final_ledger_balance.toLocaleString()}</p>
    <p>Saldo Banco: $${summary.final_bank_balance.toLocaleString()}</p>
    <p>Diferencia de Cuadre: $${summary.cuadre_gap.toLocaleString()}</p>
    <p>Discrepancias encontradas: ${discrepancies.length}</p>
  </body>
</html>`}</pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!dispatchResult && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Servidor SMTP / Simulación sandbox de entrega lista
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending || !recipient}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Notificación por Correo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
