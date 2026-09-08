import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { ReconciliationResult, AIAuditAnalysis, ReconciliationParameters } from "../types";

interface AIAuditOpinionProps {
  result: ReconciliationResult;
  parameters: ReconciliationParameters;
}

export const AIAuditOpinion: React.FC<AIAuditOpinionProps> = ({
  result,
  parameters,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAuditAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIOpinion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/ai-audit-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: result.summary,
          discrepancies: result.discrepancies,
          auditContext: `Empresa: ${parameters.company_name}, Banco: ${parameters.bank_name}, Periodo: ${parameters.period_label}`,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "Error al generar el dictamen con IA");
      }

      const data = await resp.json();
      setAiAnalysis(data);
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servicio de análisis de auditoría con IA.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
            Paso 5 • Dictamen Profesional de Auditoría (Senior AI)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Dictamen & Evaluación de Control Interno (COSO)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis cualitativo y cuantitativo con recomendaciones de gobernanza para la Dirección Financiera.
          </p>
        </div>

        <button
          id="btn-generate-ai-opinion"
          onClick={generateAIOpinion}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando Dictamen...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{aiAnalysis ? "Regenerar Dictamen" : "Emitir Dictamen de Auditoría con IA"}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!aiAnalysis && !isLoading && !error && (
        <div className="mt-6 text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200/60">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-sm font-bold text-slate-700">
            Dictamen Formal de Auditoría Contable
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Haga clic en &quot;Emitir Dictamen de Auditoría con IA&quot; para generar una opinión formal del auditor senior, evaluación de control interno COSO y carta de recomendaciones.
          </p>
        </div>
      )}

      {aiAnalysis && (
        <div className="mt-6 space-y-6">
          {/* Verdict Banner */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Opinión del Auditor Independiente
              </span>
              <span className="text-base font-extrabold text-purple-950 font-sans">
                {aiAnalysis.opinion_dictamen}
              </span>
            </div>
            <span className="text-xs font-mono text-purple-800 bg-white/80 px-2.5 py-1 rounded-md border border-purple-200">
              Evaluado conforme a NIA 505 (Confirmaciones Externas)
            </span>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Resumen Ejecutivo para la Alta Dirección
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {aiAnalysis.resumen_ejecutivo}
            </p>
          </div>

          {/* Control Interno Risk Assessment */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Evaluación de Riesgo de Control Interno (Marco COSO)
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {aiAnalysis.evaluacion_riesgo_control_interno}
            </p>
          </div>

          {/* Critical Audit Points */}
          {aiAnalysis.puntos_criticos_auditoria && aiAnalysis.puntos_criticos_auditoria.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Puntos Críticos Identificados & Recomendaciones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAnalysis.puntos_criticos_auditoria.map((point, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                  >
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      {point.titulo}
                    </div>
                    <div className="text-[11px] text-rose-700 font-medium mb-2">
                      Impacto: {point.impacto_financiero}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 block text-[10px] uppercase">
                        Recomendación:
                      </span>
                      {point.recomendacion_inmediata}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Governance Policy */}
          {aiAnalysis.politica_control_sugerida && (
            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-200 text-xs text-cyan-950">
              <span className="font-bold text-cyan-900 block mb-1 uppercase tracking-wider text-[11px]">
                Propuesta de Gobernanza y Conciliación Continua:
              </span>
              <p className="leading-relaxed">{aiAnalysis.politica_control_sugerida}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
