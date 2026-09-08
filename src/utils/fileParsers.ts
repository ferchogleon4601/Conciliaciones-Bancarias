import * as XLSX from "xlsx";
import Papa from "papaparse";
import { LedgerTransaction, BankTransaction, DiscrepancyItem } from "../types";

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const str = String(val)
    .replace(/[\$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: reject,
    });
  });
}

export function mapToLedgerTransactions(rows: any[]): LedgerTransaction[] {
  return rows.map((row, idx) => {
    let date = "";
    let reference = "";
    let description = "";
    let debit = 0;
    let credit = 0;
    let amount = 0;

    for (const [key, val] of Object.entries(row)) {
      const norm = normalizeHeader(key);
      const strVal = String(val).trim();

      if (norm.includes("fecha") || norm.includes("date") || norm.includes("dia")) {
        date = strVal;
      } else if (
        norm.includes("ref") ||
        norm.includes("comprobante") ||
        norm.includes("doc") ||
        norm.includes("cheque") ||
        norm.includes("soporte")
      ) {
        reference = strVal;
      } else if (
        norm.includes("desc") ||
        norm.includes("concepto") ||
        norm.includes("detalle") ||
        norm.includes("tercero")
      ) {
        description = strVal;
      } else if (norm.includes("debe") || norm.includes("debito") || norm.includes("ingreso")) {
        debit = parseNumeric(val);
      } else if (norm.includes("haber") || norm.includes("credito") || norm.includes("egreso")) {
        credit = parseNumeric(val);
      } else if (norm.includes("monto") || norm.includes("importe") || norm.includes("valor")) {
        amount = parseNumeric(val);
      }
    }

    if (debit > 0 || credit > 0) {
      amount = debit - credit;
    }

    return {
      id: `LEDG_${idx + 1}`,
      date: date || new Date().toISOString().split("T")[0],
      reference: reference || `REG-${idx + 1}`,
      description: description || "Registro Libro Auxiliar",
      debit,
      credit,
      amount,
    };
  });
}

export function mapToBankTransactions(rows: any[]): BankTransaction[] {
  return rows.map((row, idx) => {
    let date = "";
    let reference = "";
    let description = "";
    let inflow = 0;
    let outflow = 0;
    let amount = 0;

    for (const [key, val] of Object.entries(row)) {
      const norm = normalizeHeader(key);
      const strVal = String(val).trim();

      if (norm.includes("fecha") || norm.includes("date") || norm.includes("dia")) {
        date = strVal;
      } else if (
        norm.includes("ref") ||
        norm.includes("documento") ||
        norm.includes("operacion") ||
        norm.includes("transaccion") ||
        norm.includes("num")
      ) {
        reference = strVal;
      } else if (norm.includes("desc") || norm.includes("concepto") || norm.includes("detalle")) {
        description = strVal;
      } else if (norm.includes("abono") || norm.includes("deposito") || norm.includes("inflow") || norm.includes("credito")) {
        inflow = parseNumeric(val);
      } else if (norm.includes("cargo") || norm.includes("retiro") || norm.includes("outflow") || norm.includes("debito")) {
        outflow = parseNumeric(val);
      } else if (norm.includes("monto") || norm.includes("importe") || norm.includes("valor")) {
        const num = parseNumeric(val);
        if (num < 0) outflow = Math.abs(num);
        else inflow = num;
      }
    }

    amount = inflow - outflow;

    return {
      id: `BANK_${idx + 1}`,
      date: date || new Date().toISOString().split("T")[0],
      reference: reference || `EXT-${idx + 1}`,
      description: description || "Movimiento Extracto Bancario",
      inflow,
      outflow,
      amount,
    };
  });
}

export function exportDiscrepanciesToExcel(discrepancies: DiscrepancyItem[], companyName: string) {
  const exportRows = discrepancies.map((d, index) => ({
    "Item": index + 1,
    "ID Hallazgo": d.id,
    "Nivel de Riesgo": d.risk_level,
    "Categoría de Auditoría": d.category,
    "Título": d.title,
    "Monto Libro Auxiliar": d.ledger_amount,
    "Monto Extracto Bancario": d.bank_amount,
    "Variación Neta": d.variance,
    "Impacto Absoluto": d.abs_variance,
    "Causa Probable": d.probable_cause,
    "Acción / Ajuste Recomendado": d.remediation,
    "Impacto Contable": d.audit_impact,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Discrepancias_Auditoria");
  XLSX.writeFile(workbook, `Reporte_Discrepancias_Auditoria_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
}

export function exportDiscrepanciesToCSV(discrepancies: DiscrepancyItem[], companyName: string) {
  const exportRows = discrepancies.map((d, index) => ({
    Item: index + 1,
    ID_Hallazgo: d.id,
    Riesgo: d.risk_level,
    Categoria: d.category,
    Titulo: d.title,
    Monto_Libro: d.ledger_amount,
    Monto_Banco: d.bank_amount,
    Variacion: d.variance,
    Causa: d.probable_cause,
    Remediacion: d.remediation,
  }));

  const csv = Papa.unparse(exportRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Discrepancias_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
