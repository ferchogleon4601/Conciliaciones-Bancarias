import React, { useState } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Layers,
  Cpu,
  Zap,
  Globe,
  FileCode2,
} from "lucide-react";

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const envVariables = [
    {
      name: "GEMINI_API_KEY",
      desc: "Clave de API de Google Gemini (requerida para el dictamen del Auditor Senior con IA).",
      example: "AIzaSyD...",
    },
    {
      name: "SMTP_HOST",
      desc: "Servidor SMTP para envío real de notificaciones contables (opcional, fallback a Sandbox).",
      example: "smtp.gmail.com",
    },
    {
      name: "SMTP_PORT",
      desc: "Puerto SMTP.",
      example: "587",
    },
    {
      name: "SMTP_USER",
      desc: "Usuario o correo del despachador.",
      example: "auditoria@empresa.com",
    },
    {
      name: "SMTP_PASS",
      desc: "Contraseña o App Password de la cuenta emisora.",
      example: "••••••••••••",
    },
    {
      name: "SMTP_FROM",
      desc: "Nombre o dirección en el campo From.",
      example: "ConciliaData PRO <auditoria@empresa.com>",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 76 65" height="20">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                ConciliaData PRO en Vercel
              </h2>
              <p className="text-xs text-slate-300">
                Arquitectura Serverless optimizada y lista para producción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Status badge */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 text-xs">
                Compatibilidad 100% Verificada con Vercel
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                El proyecto ya cuenta con <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-950 font-mono">vercel.json</code>, función serverless en <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-950 font-mono">/api/index.ts</code> y motor de conciliación TypeScript/Python dual que garantiza 0 errores de contenedor en Vercel.
              </p>
            </div>
          </div>

          {/* Quick Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Pasos para Desplegar en 2 Minutos
            </h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-slate-800">
                    Sube el código a tu repositorio de GitHub
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Descarga el proyecto o exporta a GitHub desde el menú de AI Studio, y realiza el commit inicial.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-slate-800">
                    Importa el proyecto en Vercel
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entra a <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-0.5">vercel.com/new <ExternalLink className="w-3 h-3" /></a> y selecciona tu repositorio.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-slate-800">
                    Configura las Variables de Entorno (Environment Variables)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    En la sección <strong>Environment Variables</strong> de Vercel, agrega tu clave de Gemini y SMTP.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-xs text-slate-800">
                    Clic en "Deploy"
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vercel compilará Vite automáticamente y montará los endpoints de API en Serverless Functions de Node.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CLI Alternative */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Despliegue directo por Terminal (Vercel CLI)
              </span>
              <button
                onClick={() => handleCopy("npm i -g vercel\nvercel", "cli")}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedKey === "cli" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === "cli" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <pre className="font-mono text-xs bg-slate-950 p-2.5 rounded-lg text-cyan-300 overflow-x-auto">
              {`npm i -g vercel\nvercel --prod`}
            </pre>
          </div>

          {/* Environment variables list */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-indigo-600" />
              Variables de Entorno para Vercel
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {envVariables.map((ev) => (
                <div
                  key={ev.name}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-xs text-slate-800">
                        {ev.name}
                      </code>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {ev.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(ev.name, ev.name)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title={`Copiar ${ev.name}`}
                  >
                    {copiedKey === ev.name ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Output: <code className="text-slate-600">dist/</code> • API: <code className="text-slate-600">/api/index.ts</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
