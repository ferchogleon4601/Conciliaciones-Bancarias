import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Activity, Layers } from "lucide-react";
import { ReconciliationResult, ReconciliationParameters } from "../types";

interface ComparativeChartsProps {
  result: ReconciliationResult;
  parameters: ReconciliationParameters;
}

const PIE_COLORS = [
  "#10b981", // Emerald: Conciliado
  "#3b82f6", // Blue: Cheques transito
  "#f59e0b", // Amber: Depositos transito
  "#ef4444", // Red: Notas debito
  "#8b5cf6", // Purple: Notas credito
  "#ec4899", // Pink: Error importe
];

export const ComparativeCharts: React.FC<ComparativeChartsProps> = ({
  result,
  parameters,
}) => {
  const { charts, summary, matched_pairs, discrepancies } = result;

  // Format currency for chart tooltips
  const formatCurrency = (val: any) =>
    `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Discrepancies vs Matched distribution for Donut Chart
  const distributionData = [
    {
      name: "Partidas Conciliadas Exactas",
      value: matched_pairs.length,
      amount: matched_pairs.reduce((acc, curr) => acc + Math.abs(curr.ledger_item.amount), 0),
    },
    ...charts.discrepancy_categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        name: c.name,
        value: c.count,
        amount: c.amount,
      })),
  ];

  // Waterfall data
  const waterfallData = charts.waterfall_balance || [];

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            Paso 3 • Analítica Visual Comparativa
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Gráficos Comparativos de Conciliación
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspección visual de flujos contables vs. extractos bancarios, dispersión de partidas y puente de saldos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* CHART 1: Comparative Bar Chart (Libro vs Extracto) */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Comparativa de Flujos: Libros vs. Extracto Bancario
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Valores en {parameters.currency}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.comparative_summary}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="categoria"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), ""]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
                />
                <Bar
                  dataKey="Libro_Auxiliar"
                  name="Libro Auxiliar"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="Extracto_Bancario"
                  name="Extracto Bancario"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Donut / Distribution of Items */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Distribución de Partidas Conciliadas vs. Discrepancias
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Total ítems</span>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} ítems (${formatCurrency(item.payload.amount)})`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", maxWidth: "45%" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Reconciliation Waterfall Walk */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Puente de Conciliación de Saldos (Evolución de Ajustes hasta Saldo Bancario)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Saldo Contable (${summary.final_ledger_balance.toLocaleString()}) ➔ Saldo Bancario (${summary.final_bank_balance.toLocaleString()})
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="etapa"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, _name: any, item: any) => [
                    `Impacto: ${formatCurrency(value)} | Saldo Acumulado: ${formatCurrency(item.payload.acumulado)}`,
                    item.payload.etapa,
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="acumulado" name="Saldo Acumulado" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
