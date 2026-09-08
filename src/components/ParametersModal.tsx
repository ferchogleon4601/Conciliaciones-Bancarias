import React, { useState } from "react";
import { Settings, X, Check, Sliders, DollarSign, Calendar } from "lucide-react";
import { ReconciliationParameters } from "../types";

interface ParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: ReconciliationParameters;
  onSave: (params: ReconciliationParameters) => void;
}

export const ParametersModal: React.FC<ParametersModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onSave,
}) => {
  const [formData, setFormData] = useState<ReconciliationParameters>({ ...parameters });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Parámetros de Conciliación & Auditoría</h3>
              <p className="text-[11px] text-slate-400">Configuración de tolerancias y saldos iniciales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre de la Empresa / Razón Social:</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Banco:</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número de Cuenta:</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Etiqueta del Período:</label>
              <input
                type="text"
                value={formData.period_label}
                onChange={(e) => setFormData({ ...formData, period_label: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Moneda:</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tolerancia de Fecha (Días):
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.date_tolerance_days}
                onChange={(e) => setFormData({ ...formData, date_tolerance_days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Días entre emisión y cobro bancario</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tolerancia de Monto:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.amount_tolerance}
                onChange={(e) => setFormData({ ...formData, amount_tolerance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Margen para redondeos decimales</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Saldo Inicial Libro Auxiliar:
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_ledger_balance}
                onChange={(e) => setFormData({ ...formData, initial_ledger_balance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Saldo Inicial Extracto Bancario:
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_bank_balance}
                onChange={(e) => setFormData({ ...formData, initial_bank_balance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              Guardar Parámetros
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
