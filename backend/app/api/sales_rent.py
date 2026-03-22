from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SalesRent
from app.schemas import SalesRentRow, SalesRentCreate, SalesRentBatchUpdate, ClosingRequest
from app.services.sales_rent_calculator import calculate_fields
from app.services.excel_exporter import export_to_excel
import io

router = APIRouter(prefix="/api/sales/rent", tags=["sales_rent"])

def _apply_calculations(row: SalesRent) -> SalesRent:
    calc = calculate_fields(row.brokerage_fee, row.ad_fee, row.payment_fee)
    for k, v in calc.items():
        setattr(row, k, v)
    return row

# ★ リテラルパスを /{row_id} より前に定義すること

@router.get("", response_model=list[SalesRentRow])
def get_sales_rent(store_id: int, closing_month: str, employee_id: int | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(SalesRent).filter(SalesRent.store_id == store_id, SalesRent.closing_month == closing_month)
    if employee_id is not None:
        q = q.filter(SalesRent.employee_id == employee_id)
    if category:
        q = q.filter(SalesRent.category == category)
    return q.order_by(SalesRent.display_order, SalesRent.id).all()

@router.post("", response_model=SalesRentRow, status_code=201)
def create_sales_rent(payload: SalesRentCreate, db: Session = Depends(get_db)):
    max_order = db.query(SalesRent).filter(SalesRent.store_id == payload.store_id, SalesRent.closing_month == payload.closing_month).count()
    row = SalesRent(**payload.model_dump(), display_order=max_order + 1)
    _apply_calculations(row)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.patch("/batch", response_model=list[SalesRentRow])
def batch_update(payload: SalesRentBatchUpdate, db: Session = Depends(get_db)):
    results = []
    for update in payload.rows:
        row = db.get(SalesRent, update.id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Row {update.id} not found")
        for field, value in update.model_dump(exclude_unset=True, exclude={"id"}).items():
            setattr(row, field, value)
        _apply_calculations(row)
        results.append(row)
    db.commit()
    for r in results:
        db.refresh(r)
    return results

@router.post("/closing")
def closing_process(payload: ClosingRequest, db: Session = Depends(get_db)):
    rows = db.query(SalesRent).filter(SalesRent.store_id == payload.store_id, SalesRent.closing_month == payload.closing_month).all()
    for row in rows:
        row.is_closed = True
    db.commit()
    return {"closed_count": len(rows)}

@router.get("/export/excel")
def export_excel(store_id: int, closing_month: str, employee_id: int | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(SalesRent).filter(SalesRent.store_id == store_id, SalesRent.closing_month == closing_month)
    if employee_id is not None:
        q = q.filter(SalesRent.employee_id == employee_id)
    if category:
        q = q.filter(SalesRent.category == category)
    rows = q.order_by(SalesRent.display_order, SalesRent.id).all()
    buf = export_to_excel(rows)
    return StreamingResponse(
        io.BytesIO(buf),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=sales_rent_{closing_month}.xlsx"}
    )

# ★ /{row_id} は必ずリテラルパスの後に配置すること
@router.delete("/{row_id}", status_code=204)
def delete_sales_rent(row_id: int, db: Session = Depends(get_db)):
    row = db.get(SalesRent, row_id)
    if row is None:
        raise HTTPException(status_code=404)
    db.delete(row)
    db.commit()
