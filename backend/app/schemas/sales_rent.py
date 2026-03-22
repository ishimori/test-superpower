from pydantic import BaseModel
import datetime


class SalesRentRow(BaseModel):
    id: int
    display_order: int
    applied_at: datetime.date
    employee_id: int | None
    customer_name: str
    property_name: str
    brokerage_fee: int
    ad_fee: int
    payment_fee: int
    total_sales: int
    received_at: datetime.date | None
    is_white_flow: bool
    fee_calculation: int
    delivered_at: datetime.date | None
    is_delivery_flow: bool
    ad_calculation: int
    total_summary: int
    status_flag: str | None
    store_id: int
    closing_month: str
    category: str
    is_closed: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    model_config = {"from_attributes": True}


class SalesRentCreate(BaseModel):
    store_id: int
    closing_month: str
    applied_at: datetime.date | None = None
    employee_id: int | None = None
    customer_name: str = ""
    property_name: str = ""
    brokerage_fee: int = 0
    ad_fee: int = 0
    payment_fee: int = 0
    received_at: datetime.date | None = None
    is_white_flow: bool = False
    delivered_at: datetime.date | None = None
    is_delivery_flow: bool = False
    status_flag: str | None = None
    category: str = ""


class SalesRentUpdate(BaseModel):
    id: int
    applied_at: datetime.date | None = None
    employee_id: int | None = None
    customer_name: str | None = None
    property_name: str | None = None
    brokerage_fee: int | None = None
    ad_fee: int | None = None
    payment_fee: int | None = None
    received_at: datetime.date | None = None
    is_white_flow: bool | None = None
    delivered_at: datetime.date | None = None
    is_delivery_flow: bool | None = None
    status_flag: str | None = None
    category: str | None = None


class SalesRentBatchUpdate(BaseModel):
    rows: list[SalesRentUpdate]


class ClosingRequest(BaseModel):
    store_id: int
    closing_month: str
