from pydantic import BaseModel


class EmployeeResponse(BaseModel):
    id: int
    name: str
    store_id: int
    model_config = {"from_attributes": True}
