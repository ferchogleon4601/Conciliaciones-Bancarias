#!/usr/bin/env python3
"""
ConciliaData Pro - Automated Bank Reconciliation Engine
Senior Data Analyst & Audit Algorithm
Standard Library Python 3.10 compatible.
"""

import sys
import json
import re
from datetime import datetime, timedelta
from difflib import SequenceMatcher

def clean_str(val):
    if val is None:
        return ""
    return str(val).strip().lower()

def extract_reference_tokens(ref):
    if not ref:
        return []
    cleaned = re.sub(r'[^a-zA-Z0-9]', ' ', str(ref)).strip()
    tokens = [t.lower() for t in cleaned.split() if len(t) > 2]
    # Extract numeric core if exists
    digits = re.findall(r'\d{3,}', str(ref))
    return list(set(tokens + digits))

def parse_date(date_val):
    if not date_val:
        return None
    date_str = str(date_val).strip()
    # Try ISO
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S'):
        try:
            return datetime.strptime(date_str[:19].replace('T', ' '), fmt if ' ' not in fmt and 'T' not in fmt else fmt)
        except ValueError:
            pass
    try:
        # Simple regex extract YYYY, MM, DD
        m = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', date_str)
        if m:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        m = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', date_str)
        if m:
            return datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except Exception:
        pass
    return None

def text_similarity(s1, s2):
    if not s1 or not s2:
        return 0.0
    return SequenceMatcher(None, clean_str(s1), clean_str(s2)).ratio()

def reconcile(data):
    ledger_items = data.get("ledger_transactions", [])
    bank_items = data.get("bank_transactions", [])
    params = data.get("parameters", {})

    date_tolerance = int(params.get("date_tolerance_days", 5))
    amount_tolerance = float(params.get("amount_tolerance", 0.05))
    initial_ledger_balance = float(params.get("initial_ledger_balance", 0.0))
    initial_bank_balance = float(params.get("initial_bank_balance", 0.0))

    # Pre-process ledger items
    processed_ledger = []
    for idx, item in enumerate(ledger_items):
        debit = float(item.get("debit", 0.0) or 0.0)
        credit = float(item.get("credit", 0.0) or 0.0)
        # In general accounting: Debe = Cash Inflow, Haber = Cash Outflow
        net_amount = debit - credit if (debit > 0 or credit > 0) else float(item.get("amount", 0.0) or 0.0)
        dt = parse_date(item.get("date"))
        processed_ledger.append({
            "index": idx,
            "id": item.get("id", f"LEDG_{idx+1}"),
            "date_raw": item.get("date", ""),
            "date": dt.strftime('%Y-%m-%d') if dt else "",
            "datetime": dt,
            "reference": str(item.get("reference", "")).strip(),
            "description": str(item.get("description", "")).strip(),
            "debit": debit,
            "credit": credit,
            "amount": round(net_amount, 2),
            "abs_amount": round(abs(net_amount), 2),
            "flow_type": "INFLOW" if net_amount > 0 else ("OUTFLOW" if net_amount < 0 else "ZERO"),
            "matched": False,
            "match_id": None
        })

    # Pre-process bank items
    processed_bank = []
    for idx, item in enumerate(bank_items):
        inflow = float(item.get("inflow", 0.0) or 0.0)
        outflow = float(item.get("outflow", 0.0) or 0.0)
        net_amount = inflow - outflow if (inflow > 0 or outflow > 0) else float(item.get("amount", 0.0) or 0.0)
        dt = parse_date(item.get("date"))
        processed_bank.append({
            "index": idx,
            "id": item.get("id", f"BANK_{idx+1}"),
            "date_raw": item.get("date", ""),
            "date": dt.strftime('%Y-%m-%d') if dt else "",
            "datetime": dt,
            "reference": str(item.get("reference", "")).strip(),
            "description": str(item.get("description", "")).strip(),
            "inflow": inflow,
            "outflow": outflow,
            "amount": round(net_amount, 2),
            "abs_amount": round(abs(net_amount), 2),
            "flow_type": "INFLOW" if net_amount > 0 else ("OUTFLOW" if net_amount < 0 else "ZERO"),
            "matched": False,
            "match_id": None
        })

    matched_pairs = []
    discrepancies = []
    match_counter = 1

    # PASS 1: Exact Match (Reference match + Exact Amount + Flow Type)
    for l in processed_ledger:
        if l["matched"] or not l["reference"]:
            continue
        l_tokens = extract_reference_tokens(l["reference"])
        if not l_tokens:
            continue

        best_bank_match = None
        min_date_diff = 9999

        for b in processed_bank:
            if b["matched"]:
                continue
            # Check flow polarity and amount
            if l["flow_type"] != b["flow_type"] and l["flow_type"] != "ZERO" and b["flow_type"] != "ZERO":
                continue
            if abs(l["abs_amount"] - b["abs_amount"]) > amount_tolerance:
                continue

            b_tokens = extract_reference_tokens(b["reference"])
            # Check if any strong token matches
            token_intersection = set(l_tokens).intersection(set(b_tokens))
            if token_intersection or (clean_str(l["reference"]) == clean_str(b["reference"])):
                date_diff = abs((l["datetime"] - b["datetime"]).days) if (l["datetime"] and b["datetime"]) else 0
                if date_diff <= date_tolerance and date_diff < min_date_diff:
                    min_date_diff = date_diff
                    best_bank_match = b

        if best_bank_match:
            l["matched"] = True
            best_bank_match["matched"] = True
            mid = f"MATCH_{match_counter:04d}"
            match_counter += 1
            l["match_id"] = mid
            best_bank_match["match_id"] = mid
            matched_pairs.append({
                "match_id": mid,
                "tier": "EXACT_REFERENCE_AND_AMOUNT",
                "tier_name": "Coincidencia Exacta de Referencia e Importe",
                "status": "CONCILIADO",
                "ledger_item": l,
                "bank_item": best_bank_match,
                "variance": 0.0,
                "date_diff_days": min_date_diff,
                "audit_note": f"Coincidencia plena de referencia '{l['reference']}' y saldo de {l['amount']} con {min_date_diff} días de desfase."
            })

    # PASS 2: Exact Amount & High Description Similarity (within date window)
    for l in processed_ledger:
        if l["matched"]:
            continue
        best_bank_match = None
        best_score = 0.0
        min_date_diff = 9999

        for b in processed_bank:
            if b["matched"]:
                continue
            if l["flow_type"] != b["flow_type"] and l["flow_type"] != "ZERO" and b["flow_type"] != "ZERO":
                continue
            if abs(l["abs_amount"] - b["abs_amount"]) > amount_tolerance:
                continue

            date_diff = abs((l["datetime"] - b["datetime"]).days) if (l["datetime"] and b["datetime"]) else 0
            if date_diff > date_tolerance:
                continue

            sim = text_similarity(l["description"], b["description"])
            # Combined score
            score = sim + (1.0 / (date_diff + 1))
            if sim >= 0.35 and score > best_score:
                best_score = score
                best_bank_match = b
                min_date_diff = date_diff

        if best_bank_match:
            l["matched"] = True
            best_bank_match["matched"] = True
            mid = f"MATCH_{match_counter:04d}"
            match_counter += 1
            l["match_id"] = mid
            best_bank_match["match_id"] = mid
            matched_pairs.append({
                "match_id": mid,
                "tier": "FUZZY_DESCRIPTION_AND_AMOUNT",
                "tier_name": "Coincidencia por Importe y Concepto Semántico",
                "status": "CONCILIADO_SEMANTICO",
                "ledger_item": l,
                "bank_item": best_bank_match,
                "variance": 0.0,
                "date_diff_days": min_date_diff,
                "audit_note": f"Importe idéntico {l['amount']} con concepto compatible: '{l['description'][:30]}' vs '{best_bank_match['description'][:30]}'."
            })

    # PASS 3: Discrepancy Detection - Reference Matches but Amount Differs!
    # (Typical accounting errors: transposition of numbers, bank commission deducted, withholding tax omitted)
    for l in processed_ledger:
        if l["matched"] or not l["reference"]:
            continue
        l_tokens = extract_reference_tokens(l["reference"])
        if not l_tokens:
            continue

        for b in processed_bank:
            if b["matched"]:
                continue
            b_tokens = extract_reference_tokens(b["reference"])
            token_intersection = set(l_tokens).intersection(set(b_tokens))
            if token_intersection or (clean_str(l["reference"]) == clean_str(b["reference"])):
                diff = round(l["amount"] - b["amount"], 2)
                abs_diff = round(abs(diff), 2)
                if abs_diff > amount_tolerance:
                    # Detected amount discrepancy
                    l["matched"] = True
                    b["matched"] = True
                    did = f"DISC_{len(discrepancies)+1:04d}"
                    l["match_id"] = did
                    b["match_id"] = did

                    # Determine probable cause
                    risk = "ALTA" if abs_diff > 1000 else "MEDIA"
                    probable_cause = "Diferencia de Importe en Documento"
                    # Check for digit transposition (e.g. 4250 vs 4520: difference divisible by 9)
                    if int(abs_diff) == abs_diff and int(abs_diff) % 9 == 0:
                        probable_cause = "Posible Error de Transposición / Digitación (divisible por 9)"

                    discrepancy_obj = {
                        "id": did,
                        "category": "DIFERENCIA_DE_IMPORTE",
                        "title": f"Diferencia de Monto en Referencia {l['reference']}",
                        "risk_level": risk,
                        "probable_cause": probable_cause,
                        "ledger_item": l,
                        "bank_item": b,
                        "ledger_amount": l["amount"],
                        "bank_amount": b["amount"],
                        "variance": diff,
                        "abs_variance": abs_diff,
                        "remediation": f"Generar asiento de ajuste contable por {abs_diff:,.2f} contra cuenta de Diferencias por Conciliación o Proveedores/Clientes.",
                        "audit_impact": f"Libro registra {l['amount']:,.2f} mientras el banco liquidó {b['amount']:,.2f}. Descuadre neto: {diff:,.2f}."
                    }
                    discrepancies.append(discrepancy_obj)
                    break

    # PASS 4: Unmatched Ledger Transactions (Partidas pendientes en libros)
    unmatched_ledger = [l for l in processed_ledger if not l["matched"]]
    for l in unmatched_ledger:
        did = f"DISC_{len(discrepancies)+1:04d}"
        if l["flow_type"] == "OUTFLOW":
            category = "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO"
            title = f"Egreso en Tránsito (No cobrado en banco): {l['reference'] or l['description']}"
            risk = "BAJA" if abs(l["amount"]) < 2000 else "MEDIA"
            remediation = "Verificar vigencia del cheque o fecha valor de la transferencia con el beneficiario. Si supera 90 días, reclasificar."
        else:
            category = "DEPOSITO_EN_TRANSITO"
            title = f"Depósito en Tránsito (No acreditado en banco): {l['reference'] or l['description']}"
            risk = "MEDIA"
            remediation = "Confirmar con el banco la retención de canje o solicitud de confirmación de depósito."

        discrepancies.append({
            "id": did,
            "category": category,
            "title": title,
            "risk_level": risk,
            "probable_cause": "Partida pendiente de procesar en el corte bancario",
            "ledger_item": l,
            "bank_item": None,
            "ledger_amount": l["amount"],
            "bank_amount": 0.0,
            "variance": l["amount"],
            "abs_variance": round(abs(l["amount"]), 2),
            "remediation": remediation,
            "audit_impact": f"Afecta el saldo disponible real. Partida en libros por {l['amount']:,.2f} sin reflejo bancario."
        })

    # PASS 5: Unmatched Bank Transactions (Partidas bancarias no contabilizadas)
    unmatched_bank = [b for b in processed_bank if not b["matched"]]
    for b in unmatched_bank:
        did = f"DISC_{len(discrepancies)+1:04d}"
        b_desc_clean = clean_str(b["description"])

        if any(w in b_desc_clean for w in ["comision", "comisión", "fee", "mantenimiento", "cuota", "gravamen", "gmf", "4x1000", "iva", "interes debito"]):
            category = "NOTA_DEBITO_BANCARIA_NO_REGISTRADA"
            title = f"Comisión / Débito Bancario No Contabilizado: {b['description'][:40]}"
            risk = "MEDIA"
            remediation = f"Registrar Asiento Contable: Débito a Gastos Bancarios / Impuestos por {abs(b['amount']):,.2f} con Crédito a Banco."
        elif b["flow_type"] == "INFLOW":
            category = "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"
            title = f"Abono Bancario No Identificado / Rendimientos: {b['description'][:40]}"
            risk = "ALTA" if abs(b["amount"]) > 3000 else "MEDIA"
            remediation = f"Identificar tercero o registrar ingreso financiero por {abs(b['amount']):,.2f} en contabilidad."
        else:
            category = "CARGO_BANCARIO_NO_IDENTIFICADO"
            title = f"Cargo Bancario Desconocido: {b['description'][:40]}"
            risk = "ALTA"
            remediation = f"Solicitar soporte y copia de comprobante a la entidad bancaria por cobro de {abs(b['amount']):,.2f}."

        discrepancies.append({
            "id": did,
            "category": category,
            "title": title,
            "risk_level": risk,
            "probable_cause": "Movimiento debitado o acreditado por el banco no registrado oportunamente en el auxiliar",
            "ledger_item": None,
            "bank_item": b,
            "ledger_amount": 0.0,
            "bank_amount": b["amount"],
            "variance": round(-b["amount"], 2),
            "abs_variance": round(abs(b["amount"]), 2),
            "remediation": remediation,
            "audit_impact": f"Divergencia que requiere ajuste en libros contables por {b['amount']:,.2f}."
        })

    # CALCULATE FINANCIAL & AUDIT TOTALS
    total_ledger_debits = round(sum(l["debit"] for l in processed_ledger), 2)
    total_ledger_credits = round(sum(l["credit"] for l in processed_ledger), 2)
    net_ledger_movement = round(sum(l["amount"] for l in processed_ledger), 2)
    final_ledger_balance = round(initial_ledger_balance + net_ledger_movement, 2)

    total_bank_inflows = round(sum(b["inflow"] for b in processed_bank), 2)
    total_bank_outflows = round(sum(b["outflow"] for b in processed_bank), 2)
    net_bank_movement = round(sum(b["amount"] for b in processed_bank), 2)
    final_bank_balance = round(initial_bank_balance + net_bank_movement, 2)

    # Reconciliation Formula Components
    # Partidas conciliatorias:
    # (+) Cheques girados no cobrados (egresos libros no en banco)
    cheques_transito = round(sum(abs(d["ledger_amount"]) for d in discrepancies if d["category"] == "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO"), 2)
    # (-) Depósitos en tránsito (ingresos libros no en banco)
    depositos_transito = round(sum(abs(d["ledger_amount"]) for d in discrepancies if d["category"] == "DEPOSITO_EN_TRANSITO"), 2)
    # (-) Notas de Débito Bancarias no contabilizadas (gastos banco que reducen libros)
    notas_debito_banco = round(sum(abs(d["bank_amount"]) for d in discrepancies if d["category"] in ["NOTA_DEBITO_BANCARIA_NO_REGISTRADA", "CARGO_BANCARIO_NO_IDENTIFICADO"]), 2)
    # (+) Notas de Crédito Bancarias no contabilizadas (ingresos banco que aumentan libros)
    notas_credito_banco = round(sum(abs(d["bank_amount"]) for d in discrepancies if d["category"] == "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"), 2)
    # Diferencias de monto netas
    diferencias_monto_netas = round(sum(d["variance"] for d in discrepancies if d["category"] == "DIFERENCIA_DE_IMPORTE"), 2)

    # Saldo conciliado según libros:
    # Saldo Libros - Notas Débito Banco + Notas Crédito Banco - Ajustes Diferencia
    saldo_libros_ajustado = round(final_ledger_balance - notas_debito_banco + notas_credito_banco - diferencias_monto_netas, 2)
    # Saldo conciliado según banco:
    # Saldo Banco + Depósitos en Tránsito - Cheques en Tránsito
    saldo_banco_ajustado = round(final_bank_balance + depositos_transito - cheques_transito, 2)

    cuadre_gap = round(abs(saldo_libros_ajustado - saldo_banco_ajustado), 2)
    conciled_rate = round((len(matched_pairs) * 2) / max(1, len(processed_ledger) + len(processed_bank)) * 100, 1)

    # Risk metrics count
    high_risk_count = sum(1 for d in discrepancies if d["risk_level"] == "ALTA")
    med_risk_count = sum(1 for d in discrepancies if d["risk_level"] == "MEDIA")
    low_risk_count = sum(1 for d in discrepancies if d["risk_level"] == "BAJA")

    # Suggested Journal Adjustments (Asientos Contables)
    suggested_adjustments = []
    asiento_idx = 1
    # 1. Comisiones y gastos bancarios
    comisiones_items = [d for d in discrepancies if d["category"] == "NOTA_DEBITO_BANCARIA_NO_REGISTRADA"]
    if comisiones_items:
        total_com = sum(d["abs_variance"] for d in comisiones_items)
        suggested_adjustments.append({
            "asiento_num": f"AJUSTE-{asiento_idx:02d}",
            "concepto": "Reconocimiento de Gastos Bancarios, Comisiones e Impuestos no contabilizados",
            "entries": [
                {"cuenta": "530515 - Comisiones y Gastos Bancarios", "tipo": "DEBE", "monto": round(total_com, 2)},
                {"cuenta": "111005 - Moneda Nacional (Bancos)", "tipo": "HABER", "monto": round(total_com, 2)}
            ],
            "total": round(total_com, 2)
        })
        asiento_idx += 1

    # 2. Abonos o rendimientos no contabilizados
    abonos_items = [d for d in discrepancies if d["category"] == "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"]
    if abonos_items:
        total_ab = sum(d["abs_variance"] for d in abonos_items)
        suggested_adjustments.append({
            "asiento_num": f"AJUSTE-{asiento_idx:02d}",
            "concepto": "Registro de Abonos Bancarios y Rendimientos Financieros Recibidos",
            "entries": [
                {"cuenta": "111005 - Moneda Nacional (Bancos)", "tipo": "DEBE", "monto": round(total_ab, 2)},
                {"cuenta": "421005 - Rendimientos Financieros / Anticipos Clientes", "tipo": "HABER", "monto": round(total_ab, 2)}
            ],
            "total": round(total_ab, 2)
        })
        asiento_idx += 1

    # 3. Corrección por errores de importe
    dif_items = [d for d in discrepancies if d["category"] == "DIFERENCIA_DE_IMPORTE"]
    for d in dif_items:
        var = d["variance"]
        if var > 0:
            suggested_adjustments.append({
                "asiento_num": f"AJUSTE-{asiento_idx:02d}",
                "concepto": f"Corrección digitación Ref {d['ledger_item']['reference']}: Saldo en libros superior al bancario",
                "entries": [
                    {"cuenta": "220505 - Proveedores / Cuentas por Pagar (Ajuste)", "tipo": "DEBE", "monto": round(abs(var), 2)},
                    {"cuenta": "111005 - Moneda Nacional (Bancos)", "tipo": "HABER", "monto": round(abs(var), 2)}
                ],
                "total": round(abs(var), 2)
            })
        else:
            suggested_adjustments.append({
                "asiento_num": f"AJUSTE-{asiento_idx:02d}",
                "concepto": f"Corrección digitación Ref {d['ledger_item']['reference']}: Saldo en banco superior al libro",
                "entries": [
                    {"cuenta": "111005 - Moneda Nacional (Bancos)", "tipo": "DEBE", "monto": round(abs(var), 2)},
                    {"cuenta": "220505 - Proveedores / Cuentas por Pagar (Ajuste)", "tipo": "HABER", "monto": round(abs(var), 2)}
                ],
                "total": round(abs(var), 2)
            })
        asiento_idx += 1

    # Comparative charts data preparation
    comparative_summary = [
        {"categoria": "Entradas / Abonos", "Libro_Auxiliar": total_ledger_debits, "Extracto_Bancario": total_bank_inflows, "Diferencia": round(total_ledger_debits - total_bank_inflows, 2)},
        {"categoria": "Salidas / Cargos", "Libro_Auxiliar": total_ledger_credits, "Extracto_Bancario": total_bank_outflows, "Diferencia": round(total_ledger_credits - total_bank_outflows, 2)},
        {"categoria": "Flujo Neto Periodo", "Libro_Auxiliar": net_ledger_movement, "Extracto_Bancario": net_bank_movement, "Diferencia": round(net_ledger_movement - net_bank_movement, 2)},
        {"categoria": "Saldo Final Periodo", "Libro_Auxiliar": final_ledger_balance, "Extracto_Bancario": final_bank_balance, "Diferencia": round(final_ledger_balance - final_bank_balance, 2)}
    ]

    discrepancy_categories_chart = [
        {"name": "Diferencia de Importe", "count": sum(1 for d in discrepancies if d["category"] == "DIFERENCIA_DE_IMPORTE"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "DIFERENCIA_DE_IMPORTE")},
        {"name": "Cheques en Tránsito", "count": sum(1 for d in discrepancies if d["category"] == "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "CHEQUE_O_TRANSFERENCIA_EN_TRANSITO")},
        {"name": "Depósitos en Tránsito", "count": sum(1 for d in discrepancies if d["category"] == "DEPOSITO_EN_TRANSITO"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "DEPOSITO_EN_TRANSITO")},
        {"name": "Notas Débito Banco", "count": sum(1 for d in discrepancies if d["category"] == "NOTA_DEBITO_BANCARIA_NO_REGISTRADA"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "NOTA_DEBITO_BANCARIA_NO_REGISTRADA")},
        {"name": "Notas Crédito Banco", "count": sum(1 for d in discrepancies if d["category"] == "NOTA_CREDITO_BANCARIA_NO_REGISTRADA"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "NOTA_CREDITO_BANCARIA_NO_REGISTRADA")},
        {"name": "Cargos No Identificados", "count": sum(1 for d in discrepancies if d["category"] == "CARGO_BANCARIO_NO_IDENTIFICADO"), "amount": sum(d["abs_variance"] for d in discrepancies if d["category"] == "CARGO_BANCARIO_NO_IDENTIFICADO")}
    ]

    waterfall_balance = [
        {"etapa": "1. Saldo Libros", "valor": final_ledger_balance, "acumulado": final_ledger_balance},
        {"etapa": "2. (+) Cheques Tránsito", "valor": cheques_transito, "acumulado": final_ledger_balance + cheques_transito},
        {"etapa": "3. (-) Depósitos Tránsito", "valor": -depositos_transito, "acumulado": final_ledger_balance + cheques_transito - depositos_transito},
        {"etapa": "4. (+) Notas Crédito", "valor": notas_credito_banco, "acumulado": final_ledger_balance + cheques_transito - depositos_transito + notas_credito_banco},
        {"etapa": "5. (-) Notas Débito", "valor": -notas_debito_banco, "acumulado": final_ledger_balance + cheques_transito - depositos_transito + notas_credito_banco - notas_debito_banco},
        {"etapa": "6. Saldo Banco Real", "valor": final_bank_balance, "acumulado": final_bank_balance}
    ]

    # Senior Data Analyst Narrative
    audit_verdict = "CUADRE_CONCILIATORIO_EXITOSO" if cuadre_gap < 1.0 else "DESCUADRE_MATERIAL_DETECTADO"
    executive_narrative = (
        f"Dictamen de Auditoría: Se analizaron {len(processed_ledger)} registros del Libro Auxiliar Contable y "
        f"{len(processed_bank)} registros del Extracto Bancario. El índice de conciliación automática alcanzó el {conciled_rate}%, "
        f"identificando {len(matched_pairs)} partidas coincidentes plenamente. Se determinaron {len(discrepancies)} partidas conciliatorias "
        f"y discrepancias por un valor total absoluto de ${sum(d['abs_variance'] for d in discrepancies):,.2f}. "
        f"El saldo final contable se fijó en ${final_ledger_balance:,.2f} frente a un saldo bancario de ${final_bank_balance:,.2f}. "
        f"Aplicando el modelo de cédula sumaria bancaria (considerando cheques en tránsito por ${cheques_transito:,.2f}, depósitos en tránsito por ${depositos_transito:,.2f}, "
        f"notas de débito por ${notas_debito_banco:,.2f} y notas de crédito por ${notas_credito_banco:,.2f}), el gap de cuadre ajustado es de ${cuadre_gap:,.2f}."
    )

    # Clean datetime objects for JSON serialization
    for item in processed_ledger:
        if "datetime" in item:
            del item["datetime"]
    for item in processed_bank:
        if "datetime" in item:
            del item["datetime"]

    return {
        "engine": "Python 3.10 Senior Conciliation Core",
        "timestamp": datetime.now().isoformat(),
        "verdict": audit_verdict,
        "executive_narrative": executive_narrative,
        "summary": {
            "ledger_records_count": len(processed_ledger),
            "bank_records_count": len(processed_bank),
            "matched_count": len(matched_pairs),
            "discrepancies_count": len(discrepancies),
            "reconciliation_rate_pct": conciled_rate,
            "initial_ledger_balance": initial_ledger_balance,
            "final_ledger_balance": final_ledger_balance,
            "total_ledger_debits": total_ledger_debits,
            "total_ledger_credits": total_ledger_credits,
            "net_ledger_movement": net_ledger_movement,
            "initial_bank_balance": initial_bank_balance,
            "final_bank_balance": final_bank_balance,
            "total_bank_inflows": total_bank_inflows,
            "total_bank_outflows": total_bank_outflows,
            "net_bank_movement": net_bank_movement,
            "saldo_libros_ajustado": saldo_libros_ajustado,
            "saldo_banco_ajustado": saldo_banco_ajustado,
            "cuadre_gap": cuadre_gap,
            "cheques_transito": cheques_transito,
            "depositos_transito": depositos_transito,
            "notas_debito_banco": notas_debito_banco,
            "notas_credito_banco": notas_credito_banco,
            "diferencias_monto_netas": diferencias_monto_netas,
            "risk_distribution": {
                "alta": high_risk_count,
                "media": med_risk_count,
                "baja": low_risk_count
            }
        },
        "matched_pairs": matched_pairs,
        "discrepancies": discrepancies,
        "suggested_adjustments": suggested_adjustments,
        "charts": {
            "comparative_summary": comparative_summary,
            "discrepancy_categories": discrepancy_categories_chart,
            "waterfall_balance": waterfall_balance
        },
        "raw_ledger": processed_ledger,
        "raw_bank": processed_bank
    }

def main():
    if len(sys.argv) < 3:
        # Read from stdin, write to stdout
        try:
            input_data = json.load(sys.stdin)
            result = reconcile(input_data)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except Exception as e:
            sys.stderr.write(f"Error in reconcile_engine: {str(e)}\n")
            sys.exit(1)
        return

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            input_data = json.load(f)
        result = reconcile(input_data)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
    except Exception as e:
        sys.stderr.write(f"Error processing {input_file}: {str(e)}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
