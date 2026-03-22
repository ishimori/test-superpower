from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Store(Base):
    __tablename__ = "stores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    employees: Mapped[list["Employee"]] = relationship(back_populates="store")
    sales: Mapped[list["SalesRent"]] = relationship(back_populates="store")
