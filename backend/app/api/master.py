from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Store, Employee
from app.schemas import StoreResponse, EmployeeResponse

router = APIRouter(prefix="/api/master", tags=["master"])

@router.get("/stores", response_model=list[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).order_by(Store.id).all()

@router.get("/employees", response_model=list[EmployeeResponse])
def get_employees(store_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Employee)
    if store_id is not None:
        q = q.filter(Employee.store_id == store_id)
    return q.order_by(Employee.name).all()
