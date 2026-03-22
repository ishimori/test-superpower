from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
import io

HEADERS = ["#", "申込日", "社員名", "顧客名", "物件名", "仲介手数料", "広告料", "支払手数料",
           "合計売上", "入金日", "白流れ", "手数料計算", "お届日", "お届流れ", "広告計算", "合計総計"]

def export_to_excel(rows) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "売上入力"
    ws.append(HEADERS)
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
    for i, row in enumerate(rows, 1):
        ws.append([
            i, row.applied_at, row.employee_id, row.customer_name, row.property_name,
            row.brokerage_fee, row.ad_fee, row.payment_fee, row.total_sales,
            row.received_at, row.is_white_flow, row.fee_calculation,
            row.delivered_at, row.is_delivery_flow, row.ad_calculation, row.total_summary
        ])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
