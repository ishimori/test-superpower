from sqlalchemy import Integer, String, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import datetime

class SalesRent(Base):
    __tablename__ = "sales_rent"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    applied_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    property_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    brokerage_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ad_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payment_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_sales: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    received_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_white_flow: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fee_calculation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    delivered_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_delivery_flow: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ad_calculation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_summary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status_flag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    closing_month: Mapped[str] = mapped_column(String(7), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    is_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    store: Mapped["Store"] = relationship(back_populates="sales")
    employee: Mapped["Employee | None"] = relationship(back_populates="sales")
